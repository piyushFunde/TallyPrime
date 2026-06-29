package com.smarterp.repository;

import com.smarterp.entity.Ledger;
import com.smarterp.entity.LedgerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LedgerRepository extends JpaRepository<Ledger, Long> {

    List<Ledger> findByType(LedgerType type);

    List<Ledger> findByNameContainingIgnoreCase(String name);

    List<Ledger> findByTypeAndNameContainingIgnoreCase(LedgerType type, String name);

    boolean existsByNameIgnoreCase(String name);
}
