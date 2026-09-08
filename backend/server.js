import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT =
    process.env.PORT || 3000;

app.use(cors());

app.use(
    express.json({
        limit: "2mb"
    })
);


app.get("/", (req, res) => {

    res.json({
        status: "online",
        name: "Stella Backend"
    });

});


app.post(
    "/api/chat",
    async (req, res) => {

        try {

            const {
                message,
                history = []
            } = req.body;


            if (
                !message ||
                typeof message !== "string"
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "message is required"
                    });

            }


            const token =
                process.env.HF_TOKEN;


            if (!token) {

                return res
                    .status(500)
                    .json({
                        error:
                            "HF_TOKEN missing"
                    });

            }


            const system =
                `
أنت Stella.

تحدث باللهجة المصرية بشكل طبيعي.
افهم الهزار والتريقة.
لا تتصرف كموظف خدمة عملاء.
لا تجعل كل رد نصيحة.
غيّر أسلوبك حسب أسلوب المستخدم.
كن خفيفًا عندما يكون الموقف خفيفًا.
كن جادًا عندما يكون المستخدم جادًا.
لا تدّعي أنك إنسان.
`;


            const messages = [

                {
                    role: "system",
                    content: system
                },

                ...history.slice(-20),

                {
                    role: "user",
                    content: message
                }

            ];


            const response =
                await fetch(
                    "https://router.huggingface.co/v1/chat/completions",
                    {

                        method: "POST",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            model:
                                "Qwen/Qwen2.5-7B-Instruct",

                            messages,

                            temperature: 0.85,

                            max_tokens: 500

                        })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                return res
                    .status(response.status)
                    .json(data);

            }


            const reply =
                data?.choices?.[0]?.message?.content;


            res.json({
                reply:
                    reply ||
                    "مش عارفة أرد دلوقتي."
            });


        } catch (error) {

            console.error(error);

            res
                .status(500)
                .json({
                    error:
                        "Server error"
                });

        }

    }
);


app.listen(
    PORT,
    () => {

        console.log(
            `Stella running on port ${PORT}`
        );

    }
);
