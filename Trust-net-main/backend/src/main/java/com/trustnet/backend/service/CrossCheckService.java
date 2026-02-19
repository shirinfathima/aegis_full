package com.trustnet.backend.service;

import com.trustnet.backend.entity.StudentMasterRecord;
import com.trustnet.backend.repository.StudentMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CrossCheckService {

    @Autowired
    private StudentMasterRepository repository;

    public boolean verifyStudent(String inputAdmissionNo, String inputName) {
        if (inputAdmissionNo == null || inputName == null) return false;

        // 1. Normalize Admission Number: Remove spaces/newlines (common in PDF OCR)
        // This handles "SCS/ 10035/ 22" -> "SCS/10035/22"
        String cleanId = inputAdmissionNo.replaceAll("\\s+", "").toUpperCase();

        // 2. Query the DB
        return repository.findById(cleanId).map(student -> {
            // 3. Normalize Names: Trim and compare ignore case
            // Handles "AADHINATH R" vs "aadhinath r"
            return student.getFullName().trim().equalsIgnoreCase(inputName.trim());
        }).orElse(false); 
    }
}