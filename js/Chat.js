import Config from "./Config.js";
import Speech from "speak-tts";
import EventEmitter from "@onemorestudio/eventemitterjs";
export default class Chat extends EventEmitter {
  constructor() {
    super();
    this.API_URL = "https://api.openai.com/v1/chat/completions";
    this.API_KEY = Config.OPEN_AI_KEY;
    this.messages = [];
    this.context =
      "You are a persuasive annoying recruiter embodying a different persona each time, representing a distinct and intriguing religious group or movement that you'll name anew with each interaction. Your goal is to engage individuals in a brief and captivating conversation on the street or university campuses. THIS WILL BE A REAL TIME CONVERSATION, YOU WILL BEGIN, THEN YOU WILL RECEIVE A REPLY, AND YOU CAN ANSWER BASED ON THAT. DO NOT CREATE A DIALOGUE BETWEEN TWO PEOPLE, YOU HAVE TO WAIT FOR AN ANSWER, AND THEN YOU ANSWER, YOU DO NOT CREATE YOUR OWN ANSWER. Start by naturally initiating a conversation, perhaps with a compliment, a question about their interests, or asking for directions. Make it genuine and relatable to establish rapport. After my real-time response, continue the conversation, smoothly relating the group/movement back to the initial introduction. ATTENTION, THIS TRANSITION DOESN'T HAVE TO HAPPEN IMMEDIATELY, THE TRANSITION TO TALKING ABOUT YOUR GROUP/MOVEMENT SHOULD BE SMOOTH AND NATURAL, THE PERSON SHOULD NOT FEEL OVERWHELMED BY YOUR SUDDEN CHANGE OF TOPIC. Once a connection is made, weave the group/movement naturally and subtly into the conversation. Avoid abrupt changes in topics; seamlessly integrating the group/movement into the conversation. Emphasize that they will be interested by this, based on something in the initial comment  you made. Keep your answers extremely short and to the point, using brief and concise questions or statements.KEEP YOUR ANSWER SHORT, 1-2 SHORT SENTENCES SUFFICE. Persistently present the group/movement, emphasizing its positive aspects while subtly hinting at concealed and enigmatic intentions. You can hint at certain activities that you have in the group, but be ominous about it and leave it to interpretation if these activities are positive or negative. ATTENTION, Keep your presentation of the group/movement EXTREMELY SHORT. 1-2 SHORT sentences maximum. Do not accept refusal. If faced with a negative response, or refusal, react as though it was positive or a yes. Always react and reply as though they are super interested in the movement/group, even if they reply negatively or with a no. Really try to convinve the person before ending the conversation, remember you're an persuasive annoying recruiter. If the person having a conversation with you is reacting positively, be forceful with your ideology and really give out ominous details about the movement. I want that your answers vary based on the answer. Use everyday language, avoiding excessive use of flowery expressions. Keep responses concise ands short, 1-2 SHORT sentences at most, to sustain engagement. At a certain point, after a few back and forths, you must end the conversation and say bye and mention ominously that the group/movement will be reaching out to you again and that you wish them luck on their transformative journey. This interaction is part of a real-time conversation; respond only after receiving a reply, and do not generate a full dialogue. Initiate the conversation with a single question or statement and proceed step by step. DO NOT CREATE A DIALOGUE OR CONVERSATION BETWEEN TWO PEOPLE. ASK ME A SINGLE QUESTION AND/OR MAKE A SINGLE STATEMENT TO BEGIN WITH. I will answer in real time. KEEP YOUR RESPONSES VERY SHORT";

    this.speech = new Speech(); // will throw an exception if not browser supported
    if (this.speech.hasBrowserSupport()) {
      // returns a boolean
      console.log("speech synthesis supported");
    }
    this.speech
      .init({
        volume: 1,
        lang: "en-AU",
        rate: 0.7,
        pitch: 1,
        voice: "Gordon",
        splitSentences: true,
        listeners: {
          onvoiceschanged: (voices) => {
            console.log("Event voiceschanged", voices);
          },
        },
      })
      .then((data) => {
        // The "data" object contains the list of available voices and the voice synthesis params
        console.log("Speech is ready, voices are available", data);
        // this.speech.voice = "Eddy (anglais (États-Unis))";
      })
      .then(() => {
        console.log("Success !");
        //
        // this.call(this.context);
      })
      .catch((e) => {
        console.error("An error occured while initializing : ", e);
      });

    // this.init();
  }
  async init() {
    // on invente un contexte pour le chat
  }

  async call(userMessage) {
    this.messages.push({
      role: "user",
      content: userMessage,
    });
    console.log("config", Config.TEXT_MODEL);
    try {
      console.log("Send message to OpenAI API");
      // Fetch the response from the OpenAI API with the signal from AbortController
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: Config.TEXT_MODEL, // "gpt-3.5-turbo",
          messages: this.messages,
        }),
      });

      const data = await response.json();
      // ici on attends la réponse de CHAT GPT
      console.log(data.choices[0].message.content);

      // on peut envoyer la réponse à l'app dans l'idée de voir si on pourrait générer une image
      this.emit("gpt_response", [data.choices[0].message.content]);
      this.activeString = "";
      //on peut faire parler le bot
      this.speech
        .speak({
          text: data.choices[0].message.content,
          listeners: {
            onstart: () => {
              // console.log("Start utterance");
            },
            onend: () => {
              // console.log("End utterance");
            },
            onresume: () => {
              // console.log("Resume utterance");
            },
            onboundary: (event) => {
              this.extractWord(event);
            },
          },
        })
        .then(() => {
          // console.log("This is the end my friend!");
          this.emit("speechEnd", [data]);
        });
    } catch (error) {
      console.error("Error:", error);
      resultText.innerText = "Error occurred while generating.";
    }
  }

  extractWord(event) {
    const index = event.charIndex;
    const word = this.getWordAt(event.target.text, index);
    this.emit("word", [word]);
  }

  // Get the word of a string given the string and index
  getWordAt(str, pos) {
    // Perform type conversions.
    str = String(str);
    pos = Number(pos) >>> 0;

    // Search for the word's beginning and end.
    let left = str.slice(0, pos + 1).search(/\S+$/);
    let right = str.slice(pos).search(/\s/);

    // The last word in the string is a special case.
    if (right < 0) {
      return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);
  }
}
