from pyexpat import model
from django import forms

from .models import User

class UpdateUserNameForm(forms.ModelForm):
    username = forms.CharField(max_length=100,
                               required=True,
                               widget=forms.TextInput(attrs={'class': 'form-control'}))

    class Meta:
        model = User
        fields = ['username']



class UpdateUserPasswordForm(forms.ModelForm):
    password = forms.CharField(max_length=100,
                               required=True,
                               widget=forms.PasswordInput(attrs={'class': 'form-control'}))

    class Meta:
        model = User
        fields = ['password']



class UpdateUserEmailForm(forms.ModelForm):
    email = forms.EmailField(max_length=100,
                             required=True,
                             widget=forms.EmailInput(attrs={'class': 'form-control'}))

    class Meta:
        model = User
        fields = ['email']



class UpdateUserAvatarForm(forms.ModelForm):
    avatar = forms.CharField(max_length=100,
                                required=True,
                                widget=forms.TextInput(attrs={'class': 'form-control'}))
    class Meta:
        model = User
        fields = ['avatar']