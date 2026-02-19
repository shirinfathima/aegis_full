package com.trustnet.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "student_master_records")
public class StudentMasterRecord {
    
    @Id
    @Column(name = "admission_no")
    private String admissionNo; // This is the ID we use for lookup (e.g., SCS/9904/22)

    private String ktuId;
    
    private String fullName;
    
    private String programme;
    
    private String studentClass;
    
    private boolean isActive = true;
}