from django.http import HttpResponse, JsonResponse


def health_check(request):
    return JsonResponse({"Health-Check": "Alive"}) 