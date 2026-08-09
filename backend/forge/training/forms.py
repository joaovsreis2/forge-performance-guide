from decimal import Decimal

from django import forms


class CompletedSetForm(forms.Form):
    repetitions = forms.IntegerField(label="Repetições", min_value=0, required=False)
    weight_kg = forms.DecimalField(
        label="Peso (kg)",
        min_value=Decimal("0"),
        max_digits=6,
        decimal_places=2,
        required=False,
    )
    duration_seconds = forms.IntegerField(label="Duração (s)", min_value=0, required=False)
    distance_meters = forms.IntegerField(label="Distância (m)", min_value=0, required=False)

    def clean(self) -> dict[str, object]:
        cleaned_data = super().clean()
        if not any(
            cleaned_data.get(field)
            for field in ("repetitions", "weight_kg", "duration_seconds", "distance_meters")
        ):
            raise forms.ValidationError("Informe pelo menos um dado da série.")
        return cleaned_data
