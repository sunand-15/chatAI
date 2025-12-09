const messageInput = document.querySelector(".message-input");
const chatBody = document.querySelector(".chat-body");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const filecancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

//api setup
const API_KEY = "AIzaSyDzXivWtTiU_8psX2giC3SdEs9LqLCnFog";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
}

const chatHistory=[];
const initialInputHeight=messageInput.scrollHeight;

//create message element with dynamic classes and return it
const createMessagElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

//generate bot response using api
const generateBotResponse = async (incomingMessageDiv) => {
    const messagElement = incomingMessageDiv.querySelector(".message-text");

    // add user message to chat history
    chatHistory.push({
        role:"user",
        parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])]
    });


    //api request options
    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: chatHistory
        })
    }
    try {
        //fetch bot response from api
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json()
        if (!response.ok) throw new Error(data.error.message);

        //extract and display bot's response text
        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        messagElement.innerText = apiResponseText;

        //ad bot resposne to chat history
        chatHistory.push({
            role:"model",
            parts: [{ text:apiResponseText }]
        });
    } catch (error) {
        //handle error in api response
        console.log(error);
        messagElement.innerText = error.message;
        messagElement.style.color = "#ff0000"
    } finally {
        //reset user's file data.removing thinking indicator and scroll chat to bottom
        userData.file = {};
        incomingMessageDiv.classList.remove("thinking");
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavio: "smooth" });
    }
}

//handle outgoing user message
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim()
    messageInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");
    messageInput.dispatchEvent(new Event("input"));


    //create and display user message
    const messageContent = `<div class="message-text"></div>
    ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}`;
    const outgoingMessageDiv = createMessagElement(messageContent, "user-message");
    outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavio: "smooth" });

    //simulate bot response with thinking indicator after a delay
    setTimeout(() => {
        const messageContent = `<svg class=" bot-avatar"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
                        <path d="M19 16V14C19 11.1716 19 9.75736 18.1213 8.87868C17.2426 8 15.8284 8 13 8H11C8.17157 8 6.75736 8 5.87868 8.87868C5 9.75736 5 11.1716 5 14V16C5 18.8284 5 20.2426 5.87868 21.1213C6.75736 22 8.17157 22 11 22H13C15.8284 22 17.2426 22 18.1213 21.1213C19 20.2426 19 18.8284 19 16Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                        <path d="M19 18C20.4142 18 21.1213 18 21.5607 17.5607C22 17.1213 22 16.4142 22 15C22 13.5858 22 12.8787 21.5607 12.4393C21.1213 12 20.4142 12 19 12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                        <path d="M5 18C3.58579 18 2.87868 18 2.43934 17.5607C2 17.1213 2 16.4142 2 15C2 13.5858 2 12.8787 2.43934 12.4393C2.87868 12 3.58579 12 5 12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                        <path d="M13.5 3.5C13.5 4.32843 12.8284 5 12 5C11.1716 5 10.5 4.32843 10.5 3.5C10.5 2.67157 11.1716 2 12 2C12.8284 2 13.5 2.67157 13.5 3.5Z" stroke="currentColor" stroke-width="1.5" />
                        <path d="M12 5V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M9 13V14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M15 13V14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M10 17.5C10 17.5 10.6667 18 12 18C13.3333 18 14 17.5 14 17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    </svg>

                    <div class="message-text">
                        <div class="thinking-indicator">
                            <div class="dot"></div>
                            <div class="dot"></div>
                            <div class="dot"></div>
                        </div>
                    </div>`;
        const incomingMessageDiv = createMessagElement(messageContent, "bot-message", "thinking");
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavio: "smooth" });
        generateBotResponse(incomingMessageDiv);

    }, 600);
}

//handle enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
    const userMessage = e.target.value.trim();
    if (e.key === "Enter" && userMessage && !e.shiftKey && window.innerWidth > 768) {
        handleOutgoingMessage(e);
    }
});

//adjust input field height dynamically
messageInput.addEventListener("input",()=>{
    messageInput.style.height=`${initialInputHeight}px`;
    messageInput.style.height=`${messageInput.scrollHeight}px`;
    document.querySelector(".chat-form").style.borderRadius=messageInput.scrollHeight>initialInputHeight ? "15px" : "32px"
})

//handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector("img").src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");
        const base64String = e.target.result.split(",")[1];

        //store file data in userdata
        userData.file = {
            data: base64String,
            mime_type: file.type
        }
        fileInput.value = "";
    }

    reader.readAsDataURL(file);
})

//cancel file upload
filecancelButton.addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("file-uploaded");
});

//initialize emoji picker and handle emoji selection
const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
        const { selectionStart: start, selectionEnd: end } = messageInput;
        messageInput.setRangeText(emoji.native,start,end,"end");
        messageInput.focus();
    },
    onClickOutside: (e) => {
        if (e.target.id === "emoji-picker") {
            document.body.classList.toggle("show-emoji-picker");
        } else {
            document.body.classList.remove("show-emoji-picker");
        }
    }
});

document.querySelector(".chat-form").appendChild(picker);

sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());

chatbotToggler.addEventListener("click",()=> document.body.classList.toggle("show-chatbot"));

closeChatbot.addEventListener("click",()=>document.body.classList.remove("show-chatbot"));