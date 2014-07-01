#-*- coding: utf-8 -*-
from django.http import HttpResponse, Http404
from django.shortcuts import render
from django.contrib.auth.views import login
from django.contrib.auth import authenticate
from profil.models import Profil
from profil.forms import ConnexionForm
from django.shortcuts import redirect
import requests


def getUserCountry(ip):
    try:
        url = "https://freegeoip.net/json/" + ip
        r = requests.get(url)
        return r.json()['city']
    except Exception:
        return "Montreal"


def require_mtl(fn):
    def fonction_modifiee(*args, **kargs):
        ip = get_client_ip(args[0])
        city = getUserCountry(ip)
        if u'Montréal':
            return fn(*args, **kargs)
        else:
            raise Http404
    return fonction_modifiee
# Url Function
# Url Function


@require_mtl
def home(request):
    print get_client_ip(request)
    error = False
    if request.user.is_authenticated():
        return redirect('/profil/')
    if request.method == "POST":
        form = ConnexionForm(request.POST)
        if form.is_valid():
            # Nous récupérons le nom d'utilisateur
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]  # … et le mot de passe
            # Nous vérifions si les données sont correctes
            user = authenticate(username=username, password=password)
            if user:  # Si l'objet renvoyé n'est pas None
                login(request, user)  # nous connectons l'utilisateur
                errorAuthenticate = False
                return redirect('/profil/')
            else:  # sinon une erreur sera affichée
                errorAuthenticate = True
                return render(request, 'home/login.html', locals())
        else:
            return render(request, 'home/login.html', locals())
    else:
        form = ConnexionForm()

    return render(request, 'home/home.html', locals())


@require_mtl
def start(request):
    return render(request, 'home/start.html', locals())


@require_mtl
def log(request):
    return render(request, 'home/login.html', locals())


@require_mtl
def deconnexion(request):
    logout(request)
    return redirect('', locals())


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_REAL_IP')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
