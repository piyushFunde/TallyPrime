package com.smarterp.service;

import com.smarterp.dto.CompanyDTO;
import com.smarterp.entity.Company;
import com.smarterp.exception.ResourceNotFoundException;
import com.smarterp.repository.CompanyRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CompanyService {

    private final CompanyRepository companyRepository;

    /**
     * Pre-seeds a default company on startup if none exist.
     */
    @PostConstruct
    public void seedDefaultCompany() {
        if (companyRepository.count() == 0) {
            Company defaultCompany = Company.builder()
                    .name("SmartERP India Pvt Ltd")
                    .gstNumber("27AAACS1234A1Z0")
                    .financialYearStart(LocalDate.of(2026, 4, 1))
                    .financialYearEnd(LocalDate.of(2027, 3, 31))
                    .address("101, Business Towers, Bandra Kurla Complex, Mumbai")
                    .state("Maharashtra")
                    .contact("+91-22-12345678, contact@smarterp.in")
                    .build();
            companyRepository.save(defaultCompany);
        }
    }

    /**
     * Get all companies in the system.
     */
    @Transactional(readOnly = true)
    public List<CompanyDTO> getAllCompanies() {
        return companyRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific company by ID.
     */
    @Transactional(readOnly = true)
    public CompanyDTO getCompanyById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company", id));
        return toDTO(company);
    }

    /**
     * Create a new company.
     */
    public CompanyDTO createCompany(CompanyDTO dto) {
        if (companyRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalArgumentException("Company with name '" + dto.getName() + "' already exists");
        }

        LocalDate fyStart = dto.getFinancialYearStart() != null 
                ? dto.getFinancialYearStart() 
                : LocalDate.of(LocalDate.now().getYear(), 4, 1);

        LocalDate fyEnd = dto.getFinancialYearEnd() != null 
                ? dto.getFinancialYearEnd() 
                : fyStart.plusYears(1).minusDays(1);

        Company company = Company.builder()
                .name(dto.getName())
                .gstNumber(dto.getGstNumber())
                .financialYearStart(fyStart)
                .financialYearEnd(fyEnd)
                .address(dto.getAddress())
                .state(dto.getState())
                .contact(dto.getContact())
                .build();

        Company saved = companyRepository.save(company);
        return toDTO(saved);
    }

    /**
     * Update an existing company.
     */
    public CompanyDTO updateCompany(Long id, CompanyDTO dto) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company", id));

        company.setName(dto.getName());
        company.setGstNumber(dto.getGstNumber());
        if (dto.getFinancialYearStart() != null) {
            company.setFinancialYearStart(dto.getFinancialYearStart());
            company.setFinancialYearEnd(dto.getFinancialYearStart().plusYears(1).minusDays(1));
        }
        company.setAddress(dto.getAddress());
        company.setState(dto.getState());
        company.setContact(dto.getContact());

        Company saved = companyRepository.save(company);
        return toDTO(saved);
    }

    /**
     * Delete a company by ID.
     */
    public void deleteCompany(Long id) {
        if (!companyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Company", id);
        }
        companyRepository.deleteById(id);
    }

    // ========== Mapping Helpers ==========

    private CompanyDTO toDTO(Company company) {
        return CompanyDTO.builder()
                .id(company.getId())
                .name(company.getName())
                .gstNumber(company.getGstNumber())
                .financialYearStart(company.getFinancialYearStart())
                .financialYearEnd(company.getFinancialYearEnd())
                .address(company.getAddress())
                .state(company.getState())
                .contact(company.getContact())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .build();
    }
}
