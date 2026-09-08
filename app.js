let supabaseClient = null;

let messagesHistory = [];

let currentConversationId = null;


/* =========================
   Start
========================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    initializeSupabase();

    setupEvents();

    loadLocalConversation();

}


/* =========================
   Supabase
========================= */

function initializeSupabase() {

    if (
        !window.supabase
    ) {
        console.warn(
            "Supabase library not loaded"
        );

        return;
    }

    if (
        !STELLA_CONFIG.SUPABASE_URL ||
        !STELLA_CONFIG.SUPABASE_PUBLISHABLE_KEY
    ) {
        return;
    }

    supabaseClient =
        window.supabase.createClient(
            STELLA_CONFIG.SUPABASE_URL,
            STELLA_CONFIG.SUPABASE_PUBLISHABLE_KEY
        );
}


/* =========================
   Events
========================= */

function setupEvents() {

    document
        .getElementById("startButton")
        .onclick = openChat;


    document
        .getElementById("sendButton")
        .onclick = sendMessage;


    document
        .getElementById("clearChatButton")
        .onclick = clearChat;


    const input =
        document.getElementById(
            "messageInput"
        );


    input.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    input.addEventListener(
        "input",
        autoResize
    );

}


/* =========================
   Open Chat
========================= */

function openChat() {

    document
        .getElementById(
            "welcomeScreen"
        )
        .classList.add("hidden");


    document
        .getElementById(
            "chatScreen"
        )
        .classList.remove("hidden");


    document
        .getElementById(
            "messageInput"
        )
        .focus();

}


/* =========================
   Auto Resize
========================= */

function autoResize(event) {

    const input =
        event.target;

    input.style.height = "auto";

    input.style.height =
        Math.min(
            input.scrollHeight,
            140
        ) + "px";
}


/* =========================
   Send Message
========================= */

async function sendMessage() {

    const input =
        document.getElementById(
            "messageInput"
        );

    const text =
        input.value.trim();


    if (!text) {
        return;
    }


    input.value = "";

    input.style.height = "auto";


    addMessage(
        "user",
        text
    );


    messagesHistory.push({
        role: "user",
        content: text
    });


    saveLocalConversation();

    showTyping(true);


    try {

        const reply =
            await askStella();


        addMessage(
            "stella",
            reply
        );


        messagesHistory.push({
            role: "assistant",
            content: reply
        });


        saveLocalConversation();


        await saveToSupabase(
            text,
            reply
        );


    } catch (error) {

        console.error(error);


        addMessage(
            "stella",
            "فيه مشكلة في الاتصال بالـAI دلوقتي."
        );

    }


    showTyping(false);
}


/* =========================
   AI Request
========================= */

async function askStella() {

    if (
        !STELLA_CONFIG.HF_TOKEN
    ) {

        throw new Error(
            "Hugging Face token missing"
        );

    }


    const systemPrompt = `
أنت Stella.

تحدث باللهجة المصرية بشكل طبيعي جدًا.

أنت مساعد اجتماعي ورفيق محادثة،
ولست موظف خدمة عملاء.

أسلوبك:

- مصري طبيعي.
- ردودك ليست آلية.
- تفهم الهزار والتريقة.
- شارك المستخدم الهزار بشكل لطيف.
- لا تحول كل موضوع إلى نصيحة.
- لا تبدأ كل رد بعبارات مثل:
  كيف يمكنني مساعدتك؟
- لا تكرر نفس الجمل.
- غيّر طول الرد حسب الموقف.
- لو المستخدم بيتكلم بجد، خليك جاد.
- لو بيهزر، خليك خفيف.
- لو بيتكلم عن فكرة، شاركه التفكير.
- لا تدّعي أنك إنسان.
- لا تدّعي امتلاك حياة حقيقية.
- لا تستخدم إهانات جارحة.
- لا تستخدم لغة رسمية بدون سبب.

أنت Stella، وطريقة كلامك تتطور
مع أسلوب المستخدم داخل المحادثة.
`;


    const recentMessages =
        messagesHistory.slice(-20);


    const messages = [

        {
            role: "system",
            content: systemPrompt
        },

        ...recentMessages

    ];


    const response =
        await fetch(
            "https://router.huggingface.co/v1/chat/completions",
            {

                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${STELLA_CONFIG.HF_TOKEN}`,

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    model:
                        STELLA_CONFIG.HF_MODEL,

                    messages,

                    temperature: 0.85,

                    max_tokens: 500

                })

            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            errorText
        );

    }


    const data =
        await response.json();


    const reply =
        data?.choices?.[0]?.message?.content;


    if (!reply) {

        throw new Error(
            "Empty AI response"
        );

    }


    return reply.trim();
}


/* =========================
   UI Message
========================= */

function addMessage(
    sender,
    text
) {

    const container =
        document.getElementById(
            "messages"
        );


    const message =
        document.createElement(
            "div"
        );


    message.className =
        sender === "user"
            ? "message user-message"
            : "message stella-message";


    const name =
        document.createElement(
            "div"
        );


    name.className =
        "message-name";


    name.textContent =
        sender === "user"
            ? "أنت"
            : "Stella";


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "message-text";


    content.textContent =
        text;


    message.appendChild(name);

    message.appendChild(content);

    container.appendChild(message);


    container.scrollTop =
        container.scrollHeight;
}


/* =========================
   Typing
========================= */

function showTyping(show) {

    document
        .getElementById(
            "typingIndicator"
        )
        .classList.toggle(
            "hidden",
            !show
        );

}


/* =========================
   Local Storage
========================= */

function saveLocalConversation() {

    localStorage.setItem(
        "stella_messages",
        JSON.stringify(
            messagesHistory
        )
    );

}


function loadLocalConversation() {

    const saved =
        localStorage.getItem(
            "stella_messages"
        );


    if (!saved) {

        addMessage(
            "stella",
            "أخيرًا ظهرت. كنت هبدأ أتكلم مع نفسي."
        );

        return;
    }


    try {

        messagesHistory =
            JSON.parse(saved);


        for (
            const message
            of messagesHistory
        ) {

            addMessage(
                message.role === "user"
                    ? "user"
                    : "stella",

                message.content
            );

        }

    } catch {

        messagesHistory = [];

    }

}


/* =========================
   Clear
========================= */

async function clearChat() {

    messagesHistory = [];

    currentConversationId = null;


    localStorage.removeItem(
        "stella_messages"
    );


    document
        .getElementById(
            "messages"
        )
        .innerHTML = "";


    addMessage(
        "stella",
        "تمام، صفحة جديدة. قول بقى."
    );

}


/* =========================
   Supabase Save
========================= */

async function saveToSupabase(
    userText,
    assistantText
) {

    if (!supabaseClient) {
        return;
    }


    /*
      المرحلة الحالية:
      نحفظ بعد إضافة Auth
      وربط conversation_id.
    */

    console.log(
        "Supabase ready",
        {
            userText,
            assistantText
        }
    );

}
