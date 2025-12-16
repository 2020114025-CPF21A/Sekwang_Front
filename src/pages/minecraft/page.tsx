export default function Minecraft() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-green-600 mb-4">🎮 마인크래프트 테스트</h1>
        <p className="text-gray-600 text-lg">이 페이지가 보이면 라우팅이 정상 작동합니다!</p>
        <p className="text-gray-400 mt-4">Time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
