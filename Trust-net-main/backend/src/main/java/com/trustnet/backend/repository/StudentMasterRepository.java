package com.trustnet.backend.repository;

import com.trustnet.backend.entity.StudentMasterRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentMasterRepository extends JpaRepository<StudentMasterRecord, String> {
    // String because the ID (Admission No) is a String, not a Long
}