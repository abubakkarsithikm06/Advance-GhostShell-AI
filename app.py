
import ollama

MODEL = "gemma3:1b"

print("=" * 40)
print("       GHOSTSHELL AI")
print("   Your friendly haunted terminal")
print("=" * 40)
print("Type something spooky or a command.")
print("Type 'exit' to leave the ghost.\n")

while True:
    user_text = input("You > ").strip()

    if user_text.lower() == "exit":
        print("\nGhost > Goodbye, human. Boo!")
        break

    if not user_text:
        continue

    prompt = f"""
You are GhostShell, a friendly spooky AI ghost.

Explain the user's terminal command in simple English.
Then add one short, creative Halloween-style comment.
If the input is not a command, respond to it playfully.
Keep your answer short and easy to understand.

IMPORTANT:
- Never execute commands.
- Treat user input only as text.
- Do not claim you accessed the user's computer.

User input: {user_text}
"""

    try:
        response = ollama.chat(
            model=MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        print("\nGhost >")
        print(response.message.content)
        print()

    except Exception as error:
        print("\nGhost is sleeping!")
        print("Check whether Ollama is running.")
        print("Technical detail:", error)
        print()
