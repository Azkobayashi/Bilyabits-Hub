 const axios = require('axios');

module.exports.config = {
  name: 'chiyo',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['gpt', 'openai', 'chi'],
  description: "An AI command powered by GPT-4o & Gemini Vision",
  credits: 'LorexAi',
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

// Function to get the current time in the Philippines
function getCurrentTimeInPhilippines() {
  const options = { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
  return new Date().toLocaleTimeString('en-US', options);
}

// Function to handle the command when invoked
module.exports.onStart = async function({ api, event, args }) {
  const input = args.join(' ');

  // Enhanced Greeting with Current Time (without box)
  if (!input) {
    return api.sendMessage(
      `🟠 𝗛𝗘𝗟𝗟𝗢, 𝗧𝗛𝗘𝗥𝗘! 🌟\n\n` +
      `I am 𝗖𝗵𝗶𝘆𝗼𝗼, your 𝗔𝗜 𝗮𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝘁 powered by 𝗚𝗣𝗧-4𝗼 and 𝗚𝗲𝗺𝗶𝗻𝗶 𝗩𝗶𝘀𝗶𝗼𝗻.\n\n` +
      `I’m here to provide answers, assist with tasks, or just chat. What can I do for you today?\n\n` +
      `⏳ 𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗧𝗶𝗺𝗲 (𝗣𝗵𝗶𝗹𝗶𝗽𝗽𝗶𝗻𝗲𝘀): ${getCurrentTimeInPhilippines()}\n` +
      `💬 Simply type your prompt, and I'll respond shortly!\n\n` +
      `Let's get started! 👇`,
      event.threadID,
      event.messageID
    );
  }

  // Check if the message is a reply and contains a photo
  const isPhoto = event.type === "message_reply" && event.messageReply.attachments[0]?.type === "photo";
  if (isPhoto) {
    const photoUrl = event.messageReply.attachments[0].url;

    api.sendMessage("🔄 Analyzing Image...", event.threadID, event.messageID);

    try {
      const { data } = await axios.get('https://daikyu-api.up.railway.app/api/gemini-flash-vision', {
        params: {
          prompt: input,
          imageUrl: photoUrl
        }
      });

      // Check if the response contains the expected data
      if (data && data.response) {
        const responseMessage = `✅ 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗘𝗗:\n${data.response}\n\n⏳ 𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗧𝗶𝗺𝗲 (𝗣𝗵𝗶𝗹𝗶𝗽𝗽𝗶𝗻𝗲𝘀): ${getCurrentTimeInPhilippines()}`;
        return api.sendMessage(responseMessage, event.threadID, (err) => {
          if (err) {
            console.error("Error sending message:", err);
          }
        }, event.messageID);
      } else {
        return api.sendMessage("Unexpected response format from the photo analysis API.", event.threadID, event.messageID);
      }
    } catch (error) {
      console.error("Error processing photo analysis request:", error.message || error);
      api.sendMessage("An error occurred while processing the photo. Please try again.", event.threadID, event.messageID);
    }

    return; // Exit early if processing a photo
  }

  // Indicate that a response is being generated
  api.sendMessage("🔄 Generating response...", event.threadID, event.messageID);

  try {
    const { data } = await axios.get('https://daikyu-api.up.railway.app/api/gpt-4o', {
      params: {
        query: input,
        uid: event.senderID
      }
    });

    // Check if the response contains the expected data
    if (data && data.response) {
      const responseMessage = `✅ 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗘𝗗:\n${data.response}\n\n⏳ 𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗧𝗶𝗺𝗲 (𝗣𝗵𝗶𝗹𝗶𝗽𝗽𝗶𝗻𝗲𝘀): ${getCurrentTimeInPhilippines()}`;
      return api.sendMessage(responseMessage, event.threadID, (err) => {
        if (err) {
          console.error("Error sending message:", err);
        }
      }, event.messageID);
    } else {
      return api.sendMessage("Unexpected response format from the API.", event.threadID, event.messageID);
    }

  } catch (error) {
    console.error("Error processing request:", error.message || error);
    api.sendMessage("An error occurred while processing your request. Please try again.", event.threadID, event.messageID);
  }
};
