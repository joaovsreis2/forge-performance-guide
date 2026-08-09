from typing import ClassVar

from django import forms
from django.contrib.auth.forms import UserChangeForm as BaseUserChangeForm
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from .models import User, UserPreference, UserProfile


class PublicRegistrationForm(forms.Form):
    email = forms.EmailField(label="E-mail")
    display_name = forms.CharField(label="Nome de exibição", max_length=150, required=False)
    password1 = forms.CharField(label="Senha", strip=False, widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirme a senha", strip=False, widget=forms.PasswordInput)
    accepted_terms = forms.BooleanField(
        label="Aceito os termos necessários para criar minha conta",
        required=True,
    )

    def clean_email(self) -> str:
        email = User.objects.normalize_email(self.cleaned_data["email"])
        if User.objects.filter(email=email).exists():
            raise ValidationError("Este e-mail já está cadastrado.")
        return email

    def clean(self) -> dict[str, object]:
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            self.add_error("password2", "As senhas não conferem.")

        if password1:
            validate_password(password1)

        return cleaned_data


class ProfileSetupForm(forms.Form):
    display_name = forms.CharField(label="Nome de exibição", max_length=150)


class TrainingGoalForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ("training_goal",)
        labels: ClassVar[dict[str, str]] = {"training_goal": "Objetivo principal"}


class PhysicalInfoForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ("birth_date", "height_cm", "current_weight_kg")
        labels: ClassVar[dict[str, str]] = {
            "birth_date": "Data de nascimento",
            "height_cm": "Altura em centímetros",
            "current_weight_kg": "Peso atual em kg",
        }
        widgets: ClassVar[dict[str, forms.Widget]] = {
            "birth_date": forms.DateInput(attrs={"type": "date"})
        }


class AccountProfileForm(forms.Form):
    display_name = forms.CharField(label="Nome de exibição", max_length=150)
    training_goal = forms.ChoiceField(
        label="Objetivo principal",
        choices=UserProfile.TrainingGoal.choices,
        required=False,
    )
    birth_date = forms.DateField(
        label="Data de nascimento",
        required=False,
        widget=forms.DateInput(attrs={"type": "date"}),
    )
    height_cm = forms.DecimalField(label="Altura em centímetros", required=False)
    current_weight_kg = forms.DecimalField(label="Peso atual em kg", required=False)


class UserPreferenceForm(forms.ModelForm):
    class Meta:
        model = UserPreference
        fields = (
            "timezone",
            "weight_unit",
            "distance_unit",
            "appearance",
            "rest_timer_sound_enabled",
            "rest_timer_vibration_enabled",
        )
        labels: ClassVar[dict[str, str]] = {
            "timezone": "Fuso horário",
            "weight_unit": "Unidade de peso",
            "distance_unit": "Unidade de distância",
            "appearance": "Aparência",
            "rest_timer_sound_enabled": "Som do descanso",
            "rest_timer_vibration_enabled": "Vibração do descanso",
        }


class UserCreationForm(BaseUserCreationForm):
    class Meta(BaseUserCreationForm.Meta):
        model = User
        fields = ("email", "display_name")


class UserChangeForm(BaseUserChangeForm):
    class Meta(BaseUserChangeForm.Meta):
        model = User
        fields = ("email", "display_name", "is_active", "is_staff")
