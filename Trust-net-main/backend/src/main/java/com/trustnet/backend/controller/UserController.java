package com.trustnet.backend.controller;

import com.trustnet.backend.entity.User;
import com.trustnet.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity; // Import ResponseEntity
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
    Object result = userService.registerUser(user);
    if (result instanceof User) {
        // Success: return the new User object
        return ResponseEntity.ok(result);
    } else {
        // Failure: return an error message
        return ResponseEntity.status(400).body(result);
    }
}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user){ // CHANGE return type to ResponseEntity<?>
        // Call the updated service method
        Object result = userService.loginUser(user);
        
        if (result instanceof User) {
            // Success: return the User object
            return ResponseEntity.ok(result);
        } else {
            // Failure: return an Unauthorized/Bad Request response with the error message
            return ResponseEntity.status(401).body(result); 
        }
    }
}