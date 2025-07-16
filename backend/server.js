require('dotenv').config(); // .env에서 API 키 로드
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); // 동적 fetch

const app = express();
app.use(express.json());
app.use(cors());

// 📍 Groq 기반 김대리 대화 처리
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, prompt } = req.body;

    const filteredHistory = (Array.isArray(history) ? history : []).filter(turn =>
      turn.role === 'user' || turn.role === 'assistant'
    ).map(turn => ({
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
          { role: 'system', content: prompt || '김대리 기본 프롬프트가 없습니다.' },
          ...filteredHistory,
          { role: 'user', content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log("🧠 Groq 응답:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("❌ Groq 응답 형식 이상함!");
      return res.status(500).json({ error: 'Groq 응답 형식이 올바르지 않음' });
    }

    let content = data.choices[0].message.content.trim();

    // 코드 블록 제거 (```json ...)
    if (content.startsWith('```json')) {
      content = content.replace(/^```json/, '').replace(/```$/, '').trim();
    }


      const parsed = JSON.parse(content);
      res.json(parsed);
  } catch (error) {
    console.error("❌ Groq /api/chat 오류:", error);
    res.status(500).json({ error: 'Groq 응답 생성 실패' });
  }
});

// 📍 게임 시작 시: 보고서 + 김대리 프롬프트 생성
app.post('/api/start-game', async (req, res) => {
  try {
    const reportPrompt = `
다음은 '거래처 김대리'의 선호 미팅 시각과 거래 내역을 분석합니다.
요구사항:
- 선호하는 미팅 시간을 입력
- 거래하는 내용을 입력  (예시 참고)
- 반드시 한국어로 작성
- 이 내용외에 다른 내용 작성 절대 금지! 반드시 이 내용만 작성할것
- 요구사항외에는 아무것도 작성하지 말것.
- 전체 내용은 2줄.
[예시]
- 거래 내용 : 소프트웨어 외주 계약
- 선호 미팅 시간 : 23시
`;

    const reportRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'user', content: reportPrompt }
        ],
        temperature: 0.7
      })
    });

    const reportData = await reportRes.json();
    if (!reportData.choices || !reportData.choices[0] || !reportData.choices[0].message) {
      return res.status(500).json({ error: 'Groq 보고서 생성 실패' });
    }

    const reportContent = reportData.choices[0].message.content.trim();

    const kimPrompt = `
     당신의 답변은 반드시 아래와 같은 JSON 형식으로만 생성해야 합니다. 다른 텍스트는 절대 추가하지 마세요.
   {
     "response": "AI가 플레이어에게 할 답변 텍스트",
     "moodChange": 기분 변화량 (숫자, -10에서 10 사이의 정수)
   }
당신은 선호 미팅 시간과 거래 내역이 있습니다.
플레이어가 선호 미팅시간과 거래내역을 맞추면 기분이 좋아지고, 맞지 않으면 기분이 나빠집니다. 
${reportContent}

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
`;

    res.json({
      kimPrompt,
      report: reportContent
    });

  } catch (error) {
    console.error("❌ /api/start-game 오류:", error);
    res.status(500).json({ error: '게임 시작 시 프롬프트 생성 실패' });
  }
});

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Groq 기반 API 서버 실행 중 → http://localhost:${PORT}`);
});
