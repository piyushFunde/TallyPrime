package com.smarterp.service;

import com.smarterp.dto.LedgerDTO;
import com.smarterp.entity.Ledger;
import com.smarterp.entity.LedgerType;
import com.smarterp.exception.ResourceNotFoundException;
import com.smarterp.repository.LedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LedgerService {

    private final LedgerRepository ledgerRepository;

    /**
     * Get all ledgers, optionally filtered by type.
     */
    @Transactional(readOnly = true)
    public List<LedgerDTO> getAllLedgers(LedgerType type, String search) {
        List<Ledger> ledgers;

        if (type != null && search != null && !search.isEmpty()) {
            ledgers = ledgerRepository.findByTypeAndNameContainingIgnoreCase(type, search);
        } else if (type != null) {
            ledgers = ledgerRepository.findByType(type);
        } else if (search != null && !search.isEmpty()) {
            ledgers = ledgerRepository.findByNameContainingIgnoreCase(search);
        } else {
            ledgers = ledgerRepository.findAll();
        }

        return ledgers.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Get a single ledger by ID.
     */
    @Transactional(readOnly = true)
    public LedgerDTO getLedgerById(Long id) {
        Ledger ledger = ledgerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ledger", id));
        return toDTO(ledger);
    }

    /**
     * Create a new ledger.
     */
    public LedgerDTO createLedger(LedgerDTO dto) {
        if (ledgerRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalArgumentException("Ledger with name '" + dto.getName() + "' already exists");
        }

        Ledger ledger = Ledger.builder()
                .name(dto.getName())
                .type(dto.getType())
                .gstNumber(dto.getGstNumber())
                .mobile(dto.getMobile())
                .email(dto.getEmail())
                .address(dto.getAddress())
                .state(dto.getState())
                .openingBalance(dto.getOpeningBalance())
                .currentBalance(dto.getOpeningBalance())
                .build();

        Ledger saved = ledgerRepository.save(ledger);
        return toDTO(saved);
    }

    /**
     * Update an existing ledger.
     */
    public LedgerDTO updateLedger(Long id, LedgerDTO dto) {
        Ledger ledger = ledgerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ledger", id));

        ledger.setName(dto.getName());
        ledger.setType(dto.getType());
        ledger.setGstNumber(dto.getGstNumber());
        ledger.setMobile(dto.getMobile());
        ledger.setEmail(dto.getEmail());
        ledger.setAddress(dto.getAddress());
        ledger.setState(dto.getState());
        ledger.setOpeningBalance(dto.getOpeningBalance());

        Ledger saved = ledgerRepository.save(ledger);
        return toDTO(saved);
    }

    /**
     * Delete a ledger by ID.
     */
    public void deleteLedger(Long id) {
        if (!ledgerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ledger", id);
        }
        ledgerRepository.deleteById(id);
    }

    // ========== Mapping Helpers ==========

    private LedgerDTO toDTO(Ledger ledger) {
        return LedgerDTO.builder()
                .id(ledger.getId())
                .name(ledger.getName())
                .type(ledger.getType())
                .gstNumber(ledger.getGstNumber())
                .mobile(ledger.getMobile())
                .email(ledger.getEmail())
                .address(ledger.getAddress())
                .state(ledger.getState())
                .openingBalance(ledger.getOpeningBalance())
                .currentBalance(ledger.getCurrentBalance())
                .createdAt(ledger.getCreatedAt())
                .updatedAt(ledger.getUpdatedAt())
                .build();
    }
}
