# Profile extraction function

Server-side environment variables:

```env
GROQ_API_KEY=...
GROQ_MODEL=openai/gpt-oss-120b
```

The browser calls `/api/profile/extract`. Keep `GROQ_API_KEY` server-side; never use a `VITE_*` variable for it.
