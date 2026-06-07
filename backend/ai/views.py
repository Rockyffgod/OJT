import os
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from groq import Groq
from django.conf import settings

client = Groq(api_key=os.environ.get('GROQ_API_KEY', settings.GROQ_API_KEY))

SYSTEM_PROMPTS = {
    "job_matcher": """You are a smart job matcher for Hamro Karma, a Nepali service marketplace.
Given a user's free-text job description, extract structured information.
Respond in JSON format only, no extra text:
{
  "profession": "the profession needed (plumber, electrician, etc.)",
  "location": "the city/location mentioned",
  "urgency": "high/medium/low",
  "description": "clean summarized description"
}""",

    "ftl_assist": """You are an assistant for 'Find The Lost' alerts in Nepal.
Given a description of a lost item/pet/person/vehicle, extract structured info.
Respond in JSON format only:
{
  "title": "short title (max 10 words)",
  "type": "one of PERSON, PET, ITEM, VEHICLE",
  "last_seen_location": "location mentioned or Unknown",
  "contact_method": "one of PHONE, EMAIL (guess from context or default PHONE)"
}""",

    "profile_enhance": """You are a profile enhancer for service providers in Nepal.
Given a bio, rewrite it to sound professional, trustworthy, and appealing to customers.
Keep it concise (under 100 words). Nepal context: services like plumbing, cleaning, electrical work, etc.
Also suggest 3-5 skill tags.
Respond in JSON format only:
{
  "enhanced_bio": "the improved bio text",
  "suggested_skills": ["skill1", "skill2", "skill3"]
}""",
}


def call_groq(system_prompt, user_message):
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        return completion.choices[0].message.content
    except Exception as e:
        return None


class JobMatcherView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .serializers import JobMatcherInputSerializer
        serializer = JobMatcherInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        query = serializer.validated_data['query']
        result = call_groq(SYSTEM_PROMPTS["job_matcher"], query)

        if not result:
            return Response({"error": "AI service unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        import json
        try:
            parsed = json.loads(result)
        except json.JSONDecodeError:
            return Response({"result": result})

        # Match with providers in DB
        from services.models import ServiceProvider
        from django.db.models import Q

        profession = parsed.get('profession', '')
        location = parsed.get('location', '')

        providers = ServiceProvider.objects.filter(
            verification_status='APPROVED',
            is_available=True,
        )
        if profession:
            providers = providers.filter(
                Q(profession__icontains=profession) | Q(skills__icontains=profession)
            )
        if location:
            providers = providers.filter(service_area__icontains=location)

        providers_data = [
            {
                "id": str(p.id),
                "name": p.user.username,
                "profession": p.profession,
                "service_area": p.service_area,
                "hourly_rate": p.hourly_rate,
                "average_rating": p.average_rating,
                "total_jobs_completed": p.total_jobs_completed,
                "karma_level": p.karma_level,
            }
            for p in providers[:10]
        ]

        parsed['matched_providers'] = providers_data
        return Response(parsed)


class FTLAssistView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .serializers import FTLAssistInputSerializer
        serializer = FTLAssistInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        result = call_groq(SYSTEM_PROMPTS["ftl_assist"], serializer.validated_data['description'])

        if not result:
            return Response({"error": "AI service unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        import json
        try:
            parsed = json.loads(result)
        except json.JSONDecodeError:
            return Response({"result": result})

        return Response(parsed)


class ProfileEnhanceView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .serializers import ProfileEnhanceInputSerializer
        serializer = ProfileEnhanceInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        skills_str = ', '.join(data.get('skills', []))
        message = f"Bio: {data['bio']}"
        if skills_str:
            message += f"\nExisting skills: {skills_str}"

        result = call_groq(SYSTEM_PROMPTS["profile_enhance"], message)

        if not result:
            return Response({"error": "AI service unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        import json
        try:
            parsed = json.loads(result)
        except json.JSONDecodeError:
            return Response({"result": result})

        return Response(parsed)
