package com.smarterp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Company name is required")
    @Column(nullable = false)
    private String name;

    @Column(name = "gst_number", length = 15)
    private String gstNumber;

    @Column(name = "financial_year_start")
    private LocalDate financialYearStart;

    @Column(name = "financial_year_end")
    private LocalDate financialYearEnd;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String state;

    @Column(length = 150)
    private String contact;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
