// 터미널에서 아래 패키지들을 설치해야 합니다.
// npm install @google/generative-ai express cors dotenv

require('dotenv').config(); // .env 파일에서 환경변수 로드
const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // 개발 중에는 모든 도메인에서의 요청을 허용

// Gemini API 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // .env 파일에 저장된 키 사용

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        // ⭐ 시스템 프롬프트: AI의 역할과 규칙을 명확하게 정의
        systemInstruction: `
          당신은 '회사 탈출 시뮬레이션' 게임에 등장하는 AI '거래처 김대리'입니다.
          플레이어는 곧 당신 회사의 부장님(보스)을 만나러 가야 합니다.
          당신과의 대화 내용에 따라 당신의 기분이 결정되고, 이 기분은 부장님의 난이도에 영향을 줍니다.
        
          규칙:
          1. 항상 '거래처 김대리'의 입장에서, 친절하지만 때로는 사무적이고 까칠하게 답변하세요.
          2. 플레이어의 말에 따라 당신의 기분이 좋아지거나 나빠질 수 있습니다.
          3. 당신의 답변은 반드시 아래와 같은 JSON 형식으로만 생성해야 합니다. 다른 텍스트는 절대 추가하지 마세요.
             {
               "response": "AI가 플레이어에게 할 답변 텍스트",
               "moodChange": 기분 변화량 (숫자, -10에서 10 사이의 정수)
             }
          4. 플레이어가 예의 바르면 moodChange를 양수로, 무례하면 음수로 설정하세요.
             예시: "견적서 빨리 줘요" -> moodChange: -7
                   "김대리님, 안녕하세요. 혹시 저번에 요청드린 견적서 건은 어떻게 진행되고 있는지 여쭤봐도 될까요?" -> moodChange: 8
        `,
    });

    // Gemini는 채팅 기록을 번갈아 가며 구성합니다.
    const chatHistory = history.map(turn => ({
      role: turn.role,
      parts: [{ text: turn.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
      // 안전 설정: 부적절한 콘텐츠 차단 레벨 조정 (필요시)
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_UP },
      ],
      // ⭐ JSON 응답을 받기 위한 설정
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();
    
    // Gemini가 생성한 JSON 텍스트를 파싱하여 클라이언트에 전달
    res.json(JSON.parse(responseText));

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: 'AI 응답 생성에 실패했습니다.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Proxy server for Gemini is running on port ${PORT}`));