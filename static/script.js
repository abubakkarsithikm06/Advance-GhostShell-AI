
const chat = document.getElementById("chat");
const form = document.getElementById("chatForm");
const input = document.getElementById("message");
const sendButton = document.getElementById("send");
const typing = document.getElementById("typing");
const welcome = document.getElementById("welcome");
const newChatButton = document.getElementById("newChat");

const chatHistory = [];
let sessionId = 0;

// Format Ghost messages
function formatMessage(text, container) {
    const lines = text.split("\n");
    let list = null;
    let codeBlock = false;
    let codeLines = [];

    function closeList() {
        if (list) {
            container.appendChild(list);
            list = null;
        }
    }

    function addInlineText(element, text) {
        const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);

        parts.forEach(part => {
            if (part.startsWith("**") && part.endsWith("**")) {
                const bold = document.createElement("strong");
                bold.textContent = part.slice(2, -2);
                element.appendChild(bold);
            } else if (part.startsWith("`") && part.endsWith("`")) {
                const code = document.createElement("code");
                code.textContent = part.slice(1, -1);
                element.appendChild(code);
            } else {
                element.appendChild(document.createTextNode(part));
            }
        });
    }

    lines.forEach(line => {
        if (line.trim().startsWith("```")) {
            closeList();

            if (!codeBlock) {
                codeBlock = true;
                codeLines = [];
            } else {
                const pre = document.createElement("pre");
                const code = document.createElement("code");
                code.textContent = codeLines.join("\n");
                pre.appendChild(code);
                container.appendChild(pre);
                codeBlock = false;
            }
            return;
        }

        if (codeBlock) {
            codeLines.push(line);
            return;
        }

        const bullet = line.match(/^\s*[-*]\s+(.+)/);

        if (bullet) {
            if (!list) {
                list = document.createElement("ul");
            }

            const item = document.createElement("li");
            addInlineText(item, bullet[1]);
            list.appendChild(item);
            return;
        }

        closeList();

        if (!line.trim()) return;

        const paragraph = document.createElement("p");
        addInlineText(paragraph, line);
        container.appendChild(paragraph);
    });

    if (codeBlock) {
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = codeLines.join("\n");
        pre.appendChild(code);
        container.appendChild(pre);
    }

    closeList();
}

// Add chat message
function addMessage(text, sender) {
    const message = document.createElement("div");
    message.className = `message ${sender}`;

    const label = document.createElement("span");
    label.className = "message-label";
    label.textContent = sender === "user" ? "YOU" : "👻 GHOST";

    const content = document.createElement("div");
    content.className = "message-content";

    if (sender === "ghost") {
        formatMessage(text, content);
    } else {
        content.textContent = text;
    }

    message.append(label, content);
    chat.appendChild(message);

    message.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

// Send message
async function sendMessage(text) {
    const message = text.trim();

    if (!message || sendButton.disabled) return;

    const currentSession = sessionId;

    welcome.hidden = true;
    addMessage(message, "user");

    chatHistory.push({
        role: "user",
        content: message
    });

    input.value = "";
    input.focus();

    sendButton.disabled = true;
    typing.hidden = false;

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                history: chatHistory.slice(-10)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.reply || "The ghost could not respond.");
        }

        if (currentSession !== sessionId) return;

        const ghostReply =
            data.reply || "The ghost remains silent... 👻";

        chatHistory.push({
            role: "assistant",
            content: ghostReply
        });

        addMessage(ghostReply, "ghost");

        if (chatHistory.length > 10) {
            chatHistory.splice(0, chatHistory.length - 10);
        }

    } catch (error) {
        if (currentSession === sessionId) {
            addMessage(
                `Connection interrupted: ${error.message}. Check Flask and Ollama.`,
                "ghost"
            );
        }

    } finally {
        if (currentSession === sessionId) {
            typing.hidden = true;
            sendButton.disabled = false;
            input.focus();
        }
    }
}

// New Chat
if (newChatButton) {
    newChatButton.addEventListener("click", function (event) {
        event.preventDefault();

        sessionId++;
        chatHistory.length = 0;

        chat.replaceChildren();

        welcome.hidden = false;
        input.value = "";
        typing.hidden = true;
        sendButton.disabled = false;

        input.focus();
    });
}

// Form submit
form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendMessage(input.value);
});

// Suggestion buttons
document.querySelectorAll(".suggestion").forEach(function (button) {
    button.addEventListener("click", function () {
        sendMessage(button.dataset.message || "");
    });
});
