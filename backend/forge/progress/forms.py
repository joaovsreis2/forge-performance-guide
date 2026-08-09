from decimal import Decimal
from typing import ClassVar

from django import forms

from .models import BodyMeasurement, DailyRecovery, HabitDefinition, HabitEntry


class DailyRecoveryForm(forms.ModelForm):
    class Meta:
        model = DailyRecovery
        fields = ("sleep_minutes", "hydration_ml", "cardio_completed", "notes")
        labels: ClassVar[dict[str, str]] = {
            "sleep_minutes": "Sono (min)",
            "hydration_ml": "Hidratação (ml)",
            "cardio_completed": "Cardio leve concluído",
            "notes": "Notas",
        }


class BodyMeasurementForm(forms.ModelForm):
    class Meta:
        model = BodyMeasurement
        fields = (
            "weight_kg",
            "body_fat_percentage",
            "chest_cm",
            "waist_cm",
            "hips_cm",
            "notes",
        )
        labels: ClassVar[dict[str, str]] = {
            "weight_kg": "Peso (kg)",
            "body_fat_percentage": "Gordura corporal (%)",
            "chest_cm": "Peitoral (cm)",
            "waist_cm": "Cintura (cm)",
            "hips_cm": "Quadril (cm)",
            "notes": "Notas",
        }

    def clean_body_fat_percentage(self) -> Decimal | None:
        value = self.cleaned_data["body_fat_percentage"]
        if value is not None and value > Decimal("100"):
            raise forms.ValidationError("Percentual deve estar entre 0 e 100.")
        return value


class HabitDefinitionForm(forms.ModelForm):
    class Meta:
        model = HabitDefinition
        fields = ("name", "description", "frequency", "target_value", "unit")
        labels: ClassVar[dict[str, str]] = {
            "name": "Hábito",
            "description": "Descrição",
            "frequency": "Frequência",
            "target_value": "Meta",
            "unit": "Unidade",
        }


class HabitEntryForm(forms.ModelForm):
    class Meta:
        model = HabitEntry
        fields = ("status", "value_numeric", "notes")
        labels: ClassVar[dict[str, str]] = {
            "status": "Status",
            "value_numeric": "Valor",
            "notes": "Notas",
        }
