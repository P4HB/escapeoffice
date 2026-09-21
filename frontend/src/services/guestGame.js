const RECORDS_KEY = 'escapeoffice.guest.records.v1';

export function loadGuestRecords(storage) {
  try {
    storage ??= globalThis.localStorage;
    const records = JSON.parse(storage.getItem(RECORDS_KEY) || '[]');
    if (!Array.isArray(records)) return [];
    return records
      .filter(record => record && Number.isFinite(record.score) && record.score > 0
        && typeof record.playedAt === 'string')
      .sort((a, b) => a.score - b.score)
      .slice(0, 10);
  } catch {
    return [];
  }
}

export function saveGuestRecord(score, storage) {
  if (!Number.isFinite(score) || score <= 0) return false;
  try {
    storage ??= globalThis.localStorage;
    const records = [...loadGuestRecords(storage), { score, playedAt: new Date().toISOString() }]
      .sort((a, b) => a.score - b.score)
      .slice(0, 10);
    storage.setItem(RECORDS_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

// Scripted dialogue for the guest edition; no network request or AI key needed.
export function getGuestReply(message) {
  if (/바보|멍청|닥쳐|짜증|빨리|싫어/.test(message)) {
    return { response: '조금 더 차분하게 말씀해 주시겠어요? 사장님도 예의를 중요하게 생각하세요.', moodChange: -7 };
  }
  if (/안녕|감사|고맙|부탁|수고|죄송|존중/.test(message)) {
    return { response: '배려해 주셔서 감사합니다. 사장님께도 잘 말씀드릴게요!', moodChange: 8 };
  }
  if (/커피|휴가|퇴근|점심/.test(message)) {
    return { response: '저도 얼른 일을 마치고 쉬고 싶네요. 함께 힘내 봅시다!', moodChange: 4 };
  }
  return { response: '네, 말씀은 잘 들었습니다. 준비가 되셨으면 “가볼게요”라고 말씀해 주세요.', moodChange: 0 };
}
