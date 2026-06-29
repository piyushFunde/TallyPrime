package com.smarterp.controller;

import com.smarterp.dto.StockItemDTO;
import com.smarterp.service.StockItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-items")
@RequiredArgsConstructor
public class StockItemController {

    private final StockItemService stockItemService;

    @GetMapping
    public ResponseEntity<List<StockItemDTO>> getAllStockItems(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(stockItemService.getAllStockItems(search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockItemDTO> getStockItemById(@PathVariable Long id) {
        return ResponseEntity.ok(stockItemService.getStockItemById(id));
    }

    @PostMapping
    public ResponseEntity<StockItemDTO> createStockItem(@Valid @RequestBody StockItemDTO dto) {
        StockItemDTO created = stockItemService.createStockItem(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockItemDTO> updateStockItem(
            @PathVariable Long id,
            @Valid @RequestBody StockItemDTO dto) {
        return ResponseEntity.ok(stockItemService.updateStockItem(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStockItem(@PathVariable Long id) {
        stockItemService.deleteStockItem(id);
        return ResponseEntity.noContent().build();
    }
}
