import test from 'node:test';
import assert from 'node:assert/strict';
import { getGuestReply, loadGuestRecords, saveGuestRecord } from '../src/services/guestGame.js';

function memoryStorage(value = null) {
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}

test('guest clears persist and retain the fastest ten times', () => {
  const storage = memoryStorage();
  for (let score = 20; score >= 1; score--) assert.equal(saveGuestRecord(score, storage), true);
  const records = loadGuestRecords(storage);
  assert.deepEqual(records.map(record => record.score), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(records.every(record => Number.isFinite(Date.parse(record.playedAt))));
  assert.equal(saveGuestRecord(NaN, storage), false);
  assert.equal(saveGuestRecord(0, storage), false);
  assert.equal(loadGuestRecords(storage).length, 10);
});

test('corrupt and unavailable browser storage cannot break the game', () => {
  for (const value of ['invalid', '{}', 'null', '[null, {"score":-1}, {"score":"12"}]']) {
    assert.deepEqual(loadGuestRecords(memoryStorage(value)), []);
  }
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
  assert.deepEqual(loadGuestRecords(blocked), []);
  assert.equal(saveGuestRecord(50, blocked), false);
  const corrupt = memoryStorage('invalid');
  assert.equal(saveGuestRecord(25, corrupt), true);
  assert.equal(loadGuestRecords(corrupt)[0].score, 25);
});

test('scripted dialogue changes boss difficulty with bounded mood changes', () => {
  assert.ok(getGuestReply('안녕하세요 감사합니다').moodChange > 0);
  assert.ok(getGuestReply('커피 마시고 퇴근해요').moodChange > 0);
  assert.ok(getGuestReply('바보야 빨리 해').moodChange < 0);
  assert.equal(getGuestReply('오늘 회의 자료입니다').moodChange, 0);
  for (const message of ['안녕', '짜증', '', '<img src=x onerror=alert(1)>']) {
    const reply = getGuestReply(message);
    assert.ok(reply.response.length > 0);
    assert.ok(Number.isInteger(reply.moodChange) && Math.abs(reply.moodChange) <= 10);
  }
});
