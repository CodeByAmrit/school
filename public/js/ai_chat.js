const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// Function to format AI response with markdown-like styling
function formatMessage(message) {
    return message
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold **text**
        .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic *text*
        .replace(/`([^`]+)`/g, "<code>$1</code>") // Inline code `text`
        .replace(/\*\s([^*]+)\s\*/g, "$1") // Remove asterisk around single words/items
        .replace(/\*\s([^*]+)\s/g, "$1, "); // Convert bullet list to comma-separated list
}

// Function to append a chat message
function appendMessage(sender, message) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("p-3", "rounded-lg", "max-w-[80%]");
    if (sender === "user") {
        msgDiv.classList.add("bg-blue-500", "text-white", "self-end", "ml-auto");
    } else {
        msgDiv.classList.add("bg-gray-200", "text-gray-900", "self-start", "mr-auto");
    }
    msgDiv.innerHTML = formatMessage(message); // Use innerHTML to render formatted text
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to bottom
}

// Function to simulate AI response
async function getAIResponse(userMessage) {
    return fetch("/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
    })
    .then((response) => response.json())
    .then((data) => data.reply);
}

// Handle user input
sendBtn.addEventListener("click", async () => {
    const message = userInput.value.trim();
    if (message === "") return;

    appendMessage("user", message);
    userInput.value = "";

    // Get AI response and display it
    const aiResponse = await getAIResponse(message);
    appendMessage("ai", aiResponse);
});

// Allow Enter key to send message
userInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendBtn.click();
    }
});
