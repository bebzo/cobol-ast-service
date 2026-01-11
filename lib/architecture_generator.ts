/**
 * Architecture Generator v1.0
 * Transforms monolithic COBOL-to-Python output into clean modular architecture
 * 
 * Features:
 * - Domain-Driven Design structure
 * - Clean variable naming (ws_* → pythonic names)
 * - Service/Repository pattern
 * - Modular file organization
 */

export interface DomainModule {
  name: string;
  entities: string[];
  services: string[];
  repositories: string[];
  methods: string[];
}

export interface ModularArchitecture {
  domains: DomainModule[];
  shared: {
    exceptions: string;
    base_classes: string;
    utils: string;
  };
  main_orchestrator: string;
}

// Domain classification based on method/variable patterns
const DOMAIN_PATTERNS: Record<string, RegExp[]> = {
  'account': [
    /acct_/i, /account/i, /balance/i, /deposit/i, /withdraw/i,
    /p_\d+\d+_.*account/i, /p_\d+\d+_.*deposit/i, /p_\d+\d+_.*withdraw/i
  ],
  'loan': [
    /loan_/i, /mortgage/i, /amort/i, /payment/i, /interest_rate/i,
    /p_\d+\d+_.*loan/i, /p_\d+\d+_.*mortgage/i, /p_\d+\d+_.*amort/i
  ],
  'customer': [
    /cust_/i, /customer/i, /client/i, /profile/i,
    /p_\d+\d+_.*customer/i, /p_\d+\d+_.*profile/i, /p_\d+\d+_.*kyc/i
  ],
  'transaction': [
    /trans_/i, /transaction/i, /transfer/i, /payment/i, /ach_/i, /wire_/i,
    /p_\d+\d+_.*trans/i, /p_\d+\d+_.*transfer/i, /p_\d+\d+_.*wire/i
  ],
  'compliance': [
    /aml_/i, /kyc_/i, /sar_/i, /ctr_/i, /ofac/i, /sanction/i,
    /p_\d+\d+_.*aml/i, /p_\d+\d+_.*compliance/i, /p_\d+\d+_.*screening/i
  ],
  'reporting': [
    /report/i, /dashboard/i, /metric/i, /summary/i, /gl_/i,
    /p_\d+\d+_.*report/i, /p_\d+\d+_.*dashboard/i, /p_\d+\d+_.*summary/i
  ],
  'security': [
    /auth/i, /encrypt/i, /password/i, /session/i, /access/i, /key_/i,
    /p_\d+\d+_.*security/i, /p_\d+\d+_.*auth/i, /p_\d+\d+_.*encrypt/i
  ],
  'infrastructure': [
    /backup/i, /disaster/i, /failover/i, /monitor/i, /performance/i,
    /p_\d+\d+_.*backup/i, /p_\d+\d+_.*recovery/i, /p_\d+\d+_.*monitor/i
  ]
};

// Variable renaming map (COBOL → Python)
const VARIABLE_RENAMES: Record<string, string> = {
  'ws_': '',
  'acct_': 'account_',
  'cust_': 'customer_',
  'trans_': 'transaction_',
  'err_': 'error_',
  'ctl_': 'control_',
  'inv_': 'investment_',
  'ins_': 'insurance_',
  'int_': 'interest_',
  'cb_': 'chargeback_',
  'ff_': 'fed_funds_',
  'je_': 'journal_entry_',
  'hc_': 'holding_company_',
  'dr_': 'disaster_recovery_',
  'dash_': 'dashboard_',
};

/**
 * Clean variable names from COBOL style to Python style
 */
export function cleanVariableName(name: string): string {
  let cleaned = name;
  
  // Apply prefix replacements
  for (const [oldPrefix, newPrefix] of Object.entries(VARIABLE_RENAMES)) {
    if (cleaned.startsWith(oldPrefix)) {
      cleaned = newPrefix + cleaned.slice(oldPrefix.length);
      break;
    }
  }
  
  // Convert to snake_case if needed
  cleaned = cleaned.replace(/-/g, '_').toLowerCase();
  
  // Remove leading underscores if result is empty prefix
  if (cleaned.startsWith('_')) {
    cleaned = cleaned.slice(1);
  }
  
  return cleaned;
}

/**
 * Classify a method into a domain based on its name and content
 */
export function classifyMethod(methodName: string, methodContent: string): string {
  for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(methodName) || pattern.test(methodContent)) {
        return domain;
      }
    }
  }
  return 'core'; // Default domain for unclassified methods
}

/**
 * Extract methods from monolithic Python code
 */
export function extractMethods(code: string): Map<string, { name: string; content: string; domain: string }> {
  const methods = new Map<string, { name: string; content: string; domain: string }>();
  
  // Match method definitions
  const methodRegex = /^(\s*)def\s+(\w+)\s*\([^)]*\):\s*\n([\s\S]*?)(?=\n\s*def\s|\n\s*class\s|$)/gm;
  
  let match;
  while ((match = methodRegex.exec(code)) !== null) {
    const indent = match[1];
    const methodName = match[2];
    const methodBody = match[3];
    
    // Skip private/dunder methods
    if (methodName.startsWith('__') && methodName.endsWith('__')) continue;
    
    const fullMethod = `${indent}def ${methodName}(${match[0].match(/\([^)]*\)/)?.[0] || '(self)'}:\n${methodBody}`;
    const domain = classifyMethod(methodName, methodBody);
    
    methods.set(methodName, {
      name: methodName,
      content: fullMethod,
      domain
    });
  }
  
  return methods;
}

/**
 * Generate domain entity class
 */
export function generateEntity(domain: string, attributes: string[]): string {
  const className = domain.charAt(0).toUpperCase() + domain.slice(1);
  
  const cleanedAttrs = attributes.map(attr => {
    const cleaned = cleanVariableName(attr);
    return `    ${cleaned}: Any = None`;
  });
  
  return `@dataclass
class ${className}Entity:
    """${className} domain entity."""
    id: str = ""
${cleanedAttrs.slice(0, 20).join('\n')}
    
    def validate(self) -> bool:
        """Validate entity state."""
        return bool(self.id)
`;
}

/**
 * Generate service class for a domain
 */
export function generateService(domain: string, methods: string[]): string {
  const className = domain.charAt(0).toUpperCase() + domain.slice(1);
  
  return `class ${className}Service:
    """Service layer for ${domain} operations."""
    
    def __init__(self, repository: '${className}Repository'):
        self.repository = repository
        self.logger = logging.getLogger(__name__)
    
${methods.map(m => `    ${m}`).join('\n\n')}
`;
}

/**
 * Generate repository class for a domain
 */
export function generateRepository(domain: string): string {
  const className = domain.charAt(0).toUpperCase() + domain.slice(1);
  
  return `class ${className}Repository:
    """Repository for ${domain} data access."""
    
    def __init__(self, file_adapter: FileAdapter):
        self.file_adapter = file_adapter
        self.logger = logging.getLogger(__name__)
    
    def find_by_id(self, id: str) -> Optional[${className}Entity]:
        """Find entity by ID."""
        try:
            data = self.file_adapter.read(f"${domain}_{id}.json")
            return ${className}Entity(**data)
        except FileNotFoundError:
            return None
    
    def save(self, entity: ${className}Entity) -> bool:
        """Save entity to storage."""
        return self.file_adapter.write(
            f"${domain}_{entity.id}.json",
            entity.__dict__
        )
    
    def find_all(self) -> List[${className}Entity]:
        """Find all entities."""
        # Implementation depends on storage backend
        return []
`;
}

/**
 * Generate shared base classes and utilities
 */
export function generateSharedModule(): string {
  return `"""
Shared module - Base classes, exceptions, and utilities
Generated by CodeSwitch Architecture Generator
"""
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional, List, Dict, Any, TypeVar, Generic
from abc import ABC, abstractmethod
import logging
from datetime import datetime, date, timedelta
import json

T = TypeVar('T')

# === BUSINESS EXCEPTIONS ===
class BusinessError(Exception):
    """Base exception for business logic errors."""
    pass

class ValidationError(BusinessError):
    """Raised when validation fails."""
    pass

class DataNotFoundError(BusinessError):
    """Raised when required data is not found."""
    pass

class ProcessingError(BusinessError):
    """Raised when processing fails."""
    pass

class AuthorizationError(BusinessError):
    """Raised when authorization fails."""
    pass

# === BASE CLASSES ===
class Entity(ABC):
    """Base class for all domain entities."""
    
    @abstractmethod
    def validate(self) -> bool:
        """Validate entity state."""
        pass

class Repository(ABC, Generic[T]):
    """Base repository interface."""
    
    @abstractmethod
    def find_by_id(self, id: str) -> Optional[T]:
        pass
    
    @abstractmethod
    def save(self, entity: T) -> bool:
        pass

class Service(ABC):
    """Base service class."""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)

# === FILE ADAPTER ===
class FileAdapter:
    """Abstract file adapter for dependency injection."""
    def read(self, filename: str) -> Dict[str, Any]:
        raise NotImplementedError("Subclass must implement read()")
    def write(self, filename: str, data: Any) -> bool:
        raise NotImplementedError("Subclass must implement write()")

class DefaultFileAdapter(FileAdapter):
    """Production file adapter with real file I/O operations."""
    
    def __init__(self, base_path: str = "./data"):
        self.base_path = base_path
        import os
        os.makedirs(base_path, exist_ok=True)
    
    def read(self, filename: str) -> Dict[str, Any]:
        import os
        filepath = os.path.join(self.base_path, filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Record file not found: {filepath}")
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def write(self, filename: str, data: Any) -> bool:
        import os
        filepath = os.path.join(self.base_path, filename)
        serializable = {}
        for key, value in (data.items() if isinstance(data, dict) else [("data", data)]):
            if isinstance(value, Decimal):
                serializable[key] = str(value)
            else:
                serializable[key] = value
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(serializable, f, indent=2, default=str)
        return True

# === UTILITIES ===
class Money:
    """Value object for monetary amounts."""
    
    def __init__(self, amount: Decimal, currency: str = "USD"):
        self.amount = Decimal(str(amount))
        self.currency = currency
    
    def __add__(self, other: 'Money') -> 'Money':
        if self.currency != other.currency:
            raise ValueError("Cannot add different currencies")
        return Money(self.amount + other.amount, self.currency)
    
    def __sub__(self, other: 'Money') -> 'Money':
        if self.currency != other.currency:
            raise ValueError("Cannot subtract different currencies")
        return Money(self.amount - other.amount, self.currency)
    
    def is_positive(self) -> bool:
        return self.amount > 0

class Result(Generic[T]):
    """Result type for operation outcomes."""
    
    def __init__(self, value: Optional[T] = None, error: Optional[str] = None):
        self._value = value
        self._error = error
    
    @classmethod
    def success(cls, value: T) -> 'Result[T]':
        return cls(value=value)
    
    @classmethod
    def failure(cls, error: str) -> 'Result[T]':
        return cls(error=error)
    
    def is_success(self) -> bool:
        return self._error is None
    
    def is_failure(self) -> bool:
        return self._error is not None
    
    @property
    def value(self) -> T:
        if self._error:
            raise ValueError(f"Cannot get value from failed result: {self._error}")
        return self._value
    
    @property
    def error(self) -> str:
        return self._error or ""
`;
}

/**
 * Generate the main orchestrator that ties all domains together
 */
export function generateOrchestrator(domains: string[], programId: string): string {
  const imports = domains.map(d => 
    `from .${d} import ${d.charAt(0).toUpperCase() + d.slice(1)}Service, ${d.charAt(0).toUpperCase() + d.slice(1)}Repository`
  ).join('\n');
  
  const inits = domains.map(d => {
    const className = d.charAt(0).toUpperCase() + d.slice(1);
    return `        self.${d}_repository = ${className}Repository(file_adapter)
        self.${d}_service = ${className}Service(self.${d}_repository)`;
  }).join('\n');
  
  return `"""
${programId} - Main Orchestrator
Migrated from COBOL with modular architecture
Generated by CodeSwitch Architecture Generator
"""
from .shared import FileAdapter, DefaultFileAdapter, BusinessError
${imports}
import logging

class ${programId.replace(/-/g, '')}Orchestrator:
    """Main orchestrator coordinating all domain services."""
    
    def __init__(self, file_adapter: FileAdapter = None):
        file_adapter = file_adapter or DefaultFileAdapter()
        self.logger = logging.getLogger(__name__)
        
${inits}
    
    def initialize(self) -> bool:
        """Initialize all services."""
        self.logger.info("Initializing ${programId} orchestrator")
        return True
    
    def process(self, operation: str, **kwargs) -> dict:
        """Route operations to appropriate service."""
        handlers = {
${domains.map(d => `            '${d}': self.${d}_service`).join(',\n')}
        }
        
        service = handlers.get(operation.split('_')[0])
        if not service:
            raise BusinessError(f"Unknown operation domain: {operation}")
        
        method = getattr(service, operation, None)
        if not method:
            raise BusinessError(f"Unknown operation: {operation}")
        
        return method(**kwargs)
`;
}

/**
 * Main function to generate modular architecture from monolithic code
 */
export function generateModularArchitecture(
  monolithicCode: string, 
  programId: string
): ModularArchitecture {
  
  // Extract all methods
  const methods = extractMethods(monolithicCode);
  
  // Group methods by domain
  const domainMethods = new Map<string, string[]>();
  for (const [name, info] of methods) {
    const domain = info.domain;
    if (!domainMethods.has(domain)) {
      domainMethods.set(domain, []);
    }
    domainMethods.get(domain)!.push(info.content);
  }
  
  // Generate domain modules
  const domains: DomainModule[] = [];
  for (const [domain, methodList] of domainMethods) {
    domains.push({
      name: domain,
      entities: [generateEntity(domain, [])],
      services: [generateService(domain, methodList)],
      repositories: [generateRepository(domain)],
      methods: methodList
    });
  }
  
  return {
    domains,
    shared: {
      exceptions: generateSharedModule(),
      base_classes: '',
      utils: ''
    },
    main_orchestrator: generateOrchestrator(
      Array.from(domainMethods.keys()), 
      programId
    )
  };
}

export default {
  generateModularArchitecture,
  cleanVariableName,
  classifyMethod,
  extractMethods,
  generateSharedModule,
  generateOrchestrator
};
