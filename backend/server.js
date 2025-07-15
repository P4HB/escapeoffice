require('dotenv').config(); // .env에서 API 키 로드
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); // 핵심!!

const app = express();
app.use(express.json());
app.use(cors());

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    // 안전하게 history 필터링 (role이 user 또는 assistant인 것만)
    const filteredHistory = history
      .filter(turn => turn.role === 'user' || turn.role === 'assistant')
      .map(turn => ({
        role: turn.role,
        content: turn.content
      }));

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: "system",
            content: `
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
5. 당신의 응답은 반드시 완전하고 닫힌 JSON이어야 합니다. 예시:
   {
     "response": "알겠습니다. 회의 일정을 확인해드릴게요.",
     "moodChange": 3
   }
   중괄호나 따옴표가 빠지면 시스템이 오류를 발생시킵니다.
            `
          },
          ...filteredHistory,
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log("Groq 응답:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("❌ Groq 응답 형식 이상함!");
      return res.status(500).json({ error: 'Groq 응답 이상함!' });
    }

    let content = data.choices[0].message.content;

    // 코드 블록 제거 (```json ... ```)
    if (content.startsWith('```json')) {
      content = content.replace(/^```json/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(content); // 김대리의 JSON 응답
    res.json(parsed);

  } catch (error) {
    console.error("Groq API Error:", error);
    res.status(500).json({ error: 'Groq 응답 생성에 실패했습니다.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Groq API 프록시 서버 실행 중 (포트 ${PORT})`));
