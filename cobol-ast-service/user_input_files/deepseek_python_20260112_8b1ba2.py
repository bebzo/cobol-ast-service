from __future__ import annotations
from decimal import Decimal, ROUND_HALF_UP
from dataclasses import dataclass
from typing import ClassVar
from enum import Enum
import logging

logger = logging.getLogger(__name__)

# ========== DOMAIN ENUMS ==========
class CurrencyCode(Enum):
    EUR = "EUR"
    USD = "USD"
    GBP = "GBP"

class PeriodUnit(Enum):
    DAYS = "DAYS"
    MONTHS = "MONTHS"
    YEARS = "YEARS"

# ========== DOMAIN MODELS ==========
@dataclass
class InterestCalculation:
    """Représente un calcul d'intérêts financiers"""
    initial_balance: Decimal
    annual_rate: Decimal
    period_days: int
    calculated_interest: Decimal = Decimal('0')
    final_balance: Decimal = Decimal('0')
    currency: CurrencyCode = CurrencyCode.EUR
    
    # Constantes métier
    DAYS_IN_YEAR: ClassVar[int] = 365
    
    def calculate_simple_interest(self) -> None:
        """Calcule les intérêts simples selon la formule classique"""
        if self.period_days <= 0:
            raise ValueError("La période doit être positive")
            
        if self.annual_rate < 0:
            raise ValueError("Le taux ne peut pas être négatif")
        
        # Calcul avec Decimal pour la précision financière
        daily_rate = self.annual_rate / Decimal(self.DAYS_IN_YEAR)
        self.calculated_interest = (
            self.initial_balance * 
            daily_rate * 
            Decimal(self.period_days)
        ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        self.final_balance = (
            self.initial_balance + self.calculated_interest
        ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        logger.info(f"Intérêts calculés: {self.calculated_interest}")

# ========== PRESENTATION LAYER ==========
class InterestCalculationReport:
    """Génère les rapports d'affichage"""
    
    @staticmethod
    def format_currency(amount: Decimal, currency: CurrencyCode) -> str:
        """Formate un montant selon la devise"""
        return f"{amount:,.2f} {currency.value}"
    
    @staticmethod
    def format_percentage(rate: Decimal) -> str:
        """Formate un taux en pourcentage"""
        return f"{rate * 100:.3f}%"
    
    def generate_report(self, calculation: InterestCalculation) -> str:
        """Génère un rapport détaillé du calcul"""
        lines = [
            "=" * 40,
            "CALCUL D'INTÉRÊTS BANCAIRES - PYTHON MODERNE",
            "=" * 40,
            f"Solde initial: {self.format_currency(calculation.initial_balance, calculation.currency)}",
            f"Taux annuel: {self.format_percentage(calculation.annual_rate)}",
            f"Période: {calculation.period_days} jours",
            "-" * 40,
            f"Intérêts calculés: {self.format_currency(calculation.calculated_interest, calculation.currency)}",
            f"Nouveau solde: {self.format_currency(calculation.final_balance, calculation.currency)}",
            "=" * 40
        ]
        return "\n".join(lines)

# ========== SERVICE LAYER ==========
class BankingService:
    """Service métier pour les opérations bancaires"""
    
    def __init__(self):
        self.report_generator = InterestCalculationReport()
    
    def execute_interest_calculation(
        self,
        balance: Decimal,
        rate: Decimal,
        days: int
    ) -> dict[str, str]:
        """Exécute un calcul complet et retourne les résultats"""
        try:
            # Création du calcul
            calculation = InterestCalculation(
                initial_balance=balance,
                annual_rate=rate,
                period_days=days
            )
            
            # Calcul
            calculation.calculate_simple_interest()
            
            # Génération du rapport
            report = self.report_generator.generate_report(calculation)
            
            # Log et retour
            logger.info("Calcul d'intérêts terminé avec succès")
            
            return {
                "success": True,
                "report": report,
                "interest": calculation.calculated_interest,
                "final_balance": calculation.final_balance
            }
            
        except ValueError as e:
            logger.error(f"Erreur de validation: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Erreur inattendue: {e}")
            return {"success": False, "error": "Erreur système"}

# ========== MAIN EXECUTION ==========
def main() -> None:
    """Point d'entrée principal - simule le programme COBOL original"""
    
    # Configuration du logging
    logging.basicConfig(level=logging.INFO)
    
    # Initialisation du service
    service = BankingService()
    
    # Paramètres (équivalents aux variables COBOL)
    initial_balance = Decimal('100000.00')
    annual_rate = Decimal('0.025')  # 2.5%
    period_days = 30
    
    # Exécution
    result = service.execute_interest_calculation(
        balance=initial_balance,
        rate=annual_rate,
        days=period_days
    )
    
    # Affichage
    if result["success"]:
        print(result["report"])
        
        # Affichage supplémentaire structuré
        print("\n" + "=" * 40)
        print("DONNÉES STRUCTURÉES POUR INTÉGRATION:")
        print("=" * 40)
        print(f"Intérêts (Decimal): {result['interest']}")
        print(f"Solde final (Decimal): {result['final_balance']}")
    else:
        print(f"ERREUR: {result.get('error', 'Inconnue')}")

if __name__ == "__main__":
    main()