package com.smarterp.controller;

import com.smarterp.dto.LedgerDTO;
import com.smarterp.entity.LedgerType;
import com.smarterp.service.LedgerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ledgers")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping
    public ResponseEntity<List<LedgerDTO>> getAllLedgers(
            @RequestParam(required = false) LedgerType type,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ledgerService.getAllLedgers(type, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LedgerDTO> getLedgerById(@PathVariable Long id) {
        return ResponseEntity.ok(ledgerService.getLedgerById(id));
    }

    @PostMapping
    public ResponseEntity<LedgerDTO> createLedger(@Valid @RequestBody LedgerDTO dto) {
        LedgerDTO created = ledgerService.createLedger(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LedgerDTO> updateLedger(
            @PathVariable Long id,
            @Valid @RequestBody LedgerDTO dto) {
        return ResponseEntity.ok(ledgerService.updateLedger(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLedger(@PathVariable Long id) {
        ledgerService.deleteLedger(id);
        return ResponseEntity.noContent().build();
    }
}
