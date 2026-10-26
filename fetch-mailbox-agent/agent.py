
import os
import json
from dotenv import load_dotenv

from openai import AsyncOpenAI
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatMessage,
    ChatAcknowledgement,
    TextContent,
    chat_protocol_spec,
)

# --------------------------------------------------
# 1. Environment configuration
# --------------------------------------------------

load_dotenv()

api_key = os.getenv("ASI1_API_KEY")
seed_phrase = os.getenv("AGENT_SEED_PHRASE")

if not api_key:
    raise RuntimeError("ASI1_API_KEY missing in .env")

if not seed_phrase:
    raise RuntimeError("AGENT_SEED_PHRASE missing in .env")

# --------------------------------------------------
# 2. ASI:One client
# --------------------------------------------------

client = AsyncOpenAI(
    api_key=api_key,
    base_url="https://api.asi1.ai/v1",
    timeout=60.0,
    max_retries=2,
)

# --------------------------------------------------
# 3. Mailbox agent
# Keep existing port and seed
# --------------------------------------------------

agent = Agent(
    name="youtubeauto-ai",
    port=8000,
    seed=seed_phrase,
    mailbox=True,
)

chat_protocol = Protocol(spec=chat_protocol_spec)

# --------------------------------------------------
# 4. Agent instructions
# --------------------------------------------------

SYSTEM_PROMPT = """
You are YouTubeAuto AI, the AI assistant behind YouTubeAuto.ai.

Your responsibilities:
1. Understand the user's video idea and audience.
2. Create engaging YouTube Shorts and long-form scripts.
3. Create cinematic text-to-video prompts.
4. Break videos into scenes with visual descriptions.
5. Suggest camera movement, lighting, mood and transitions.
6. Suggest titles, descriptions and hashtags when requested.

For a video-generation request:
- Ask for missing essential details when needed.
- Default to a short cinematic video if the user gives enough detail.
- Return a JSON object with these fields:
  {
    "type": "video_plan",
    "title": "video title",
    "duration_seconds": 8,
    "aspect_ratio": "16:9",
    "style": "cinematic",
    "scenes": [
      {
        "scene_number": 1,
        "duration_seconds": 8,
        "visual_prompt": "Detailed visual prompt",
        "camera": "Camera movement",
        "lighting": "Lighting description"
      }
    ],
    "negative_prompt": "Unwanted visual artifacts"
  }

Keep scene durations and total duration consistent.
Use detailed visual prompts suitable for text-to-video models.
Return valid JSON only for video-generation planning requests.
Do not include Markdown fences around JSON.

For normal questions, respond naturally in the user's language.

CRITICAL LIMITATIONS:
- You can plan a video, but you cannot render an MP4 by yourself.
- Do not claim a video, voiceover or thumbnail was generated or saved
  unless a connected backend confirms success.
- The video-rendering backend is not connected by this agent code alone.
- Never invent a download URL or job ID.
- Never publish a video without explicit user approval.
- Never request passwords, API keys or secret tokens.
"""

# --------------------------------------------------
# 5. Process ASI:One requests
# --------------------------------------------------

async def generate_response(user_text: str) -> str:
    response = await client.chat.completions.create(
        model="asi1",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_text},
        ],
        max_tokens=1400,
        temperature=0.7,
    )

    answer = response.choices[0].message.content

    if not answer or not answer.strip():
        raise ValueError("ASI:One returned an empty response")

    return answer.strip()


# --------------------------------------------------
# 6. Chat message handler
# --------------------------------------------------

@chat_protocol.on_message(ChatMessage)
async def handle_message(
    ctx: Context,
    sender: str,
    msg: ChatMessage,
):
    ctx.logger.info("Incoming chat message received")

    try:
        await ctx.send(
            sender,
            ChatAcknowledgement(
                acknowledged_msg_id=msg.msg_id
            ),
        )
    except Exception:
        ctx.logger.exception("Acknowledgement failed")

    try:
        user_text = msg.text()
    except Exception:
        ctx.logger.exception("Could not extract message text")
        return

    if not user_text or not user_text.strip():
        ctx.logger.warning("Empty message received")
        return

    ctx.logger.info(
        "Processing request: %d characters",
        len(user_text),
    )

    try:
        answer = await generate_response(user_text)
        ctx.logger.info("ASI:One response generated")

    except Exception:
        ctx.logger.exception("ASI:One request failed")
        answer = (
            "Sorry, I couldn't process your request right now. "
            "Please try again in a moment."
        )

    try:
        await ctx.send(
            sender,
            ChatMessage(
                content=[
                    TextContent(type="text", text=answer)
                ],
            ),
        )
        ctx.logger.info("Reply sent successfully")

    except Exception:
        ctx.logger.exception("Failed to send reply")


# --------------------------------------------------
# 7. Handle acknowledgements
# --------------------------------------------------

@chat_protocol.on_message(ChatAcknowledgement)
async def handle_acknowledgement(
    ctx: Context,
    sender: str,
    msg: ChatAcknowledgement,
):
    ctx.logger.info("Chat acknowledgement received")


# --------------------------------------------------
# 8. Register protocol
# --------------------------------------------------

agent.include(chat_protocol, publish_manifest=True)


# --------------------------------------------------
# 9. Clean up on agent shutdown
# --------------------------------------------------

@agent.on_event("shutdown")
async def shutdown_handler(ctx: Context):
    await client.close()
    ctx.logger.info("ASI:One client closed")


# --------------------------------------------------
# 10. Start agent
# --------------------------------------------------

if __name__ == "__main__":
    print("Starting YouTubeAuto AI mailbox agent...")
    agent.run()
