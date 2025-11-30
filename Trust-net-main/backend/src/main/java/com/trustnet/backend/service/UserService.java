package com.trustnet.backend.service;

import com.trustnet.backend.entity.User;
import com.trustnet.backend.model.Role;
import com.trustnet.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;

@Service
public class UserService {
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private UserRepository userRepo;

    /**
     * Generates a mock Decentralized Identifier (DID) and an ECC key pair.
     * @return String array: [DID, base64EncodedPrivateKey]
     */
    private String[] generateDidAndKeyPair() {
        try {
            // 1. Generate an ECC Key Pair
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("EC");
            keyGen.initialize(new ECGenParameterSpec("secp256r1"), new SecureRandom());
            KeyPair pair = keyGen.generateKeyPair();
            
            // 2. Derive DID (simplified: use a hash of the public key for the DID)
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] publicKeyHash = digest.digest(pair.getPublic().getEncoded());
            // DID format: did:trustnet:<base64(hash(publicKey))>
            String did = "did:trustnet:" + Base64.getUrlEncoder().withoutPadding().encodeToString(publicKeyHash);
            
            // 3. Encode the Private Key
            String privateKeyB64 = Base64.getEncoder().encodeToString(pair.getPrivate().getEncoded());

            return new String[]{did, privateKeyB64};
        } catch (Exception e) {
            // In a real application, proper error logging/handling would be used.
            throw new RuntimeException("Failed to generate DID or Key Pair: " + e.getMessage(), e);
        }
    }

    public Object registerUser(User user) {
        if (userRepo.existsByEmail(user.getEmail())) {
            return "Email already registered";
        }
        
        // Store the plain text password to use for key encryption (before it is hashed for login)
        String plainTextPassword = user.getPassword(); 
        
        // --- DID/Key Generation and Storage ---
        // 1. Generate DID and Keys
        String[] didData = generateDidAndKeyPair();
        String did = didData[0];
        String privateKeyB64 = didData[1];

        // 2. Encrypt Private Key for secure storage
        // The plain text private key is encrypted using the password encoder 
        // (acting as a basic password-derived encryption mechanism for this PoC).
        String encryptedPrivateKey = passwordEncoder.encode(privateKeyB64);

        // 3. Set DID and Encrypted Key on the User object
        user.setDid(did);
        user.setDidPrivateKey(encryptedPrivateKey);
        // --- END DID/Key Generation and Storage ---

        user.setPassword(passwordEncoder.encode(plainTextPassword)); // Encrypt password for login
        if (user.getRole() == null) {
            user.setRole(Role.USER); // default role
        }
        User savedUser = userRepo.save(user);
        return savedUser;
    }
    
    public Object loginUser(User loginData) {
    User user = userRepo.findByEmail(loginData.getEmail());
    if (user == null) {
        return "User not found";
    }

    if (passwordEncoder.matches(loginData.getPassword(), user.getPassword())) {
        return user;
    } else {
        return "Invalid password";
    }
}

}