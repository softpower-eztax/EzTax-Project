import React from 'react';

function App() {
  console.log("Minimal App component rendering");
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">EzTax</h1>
          <p className="text-xl text-gray-600">세금계산 및 은퇴준비 애플리케이션</p>
        </header>
        
        <main className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">
            세상쉬운 세금계산 세상귀한 노후준비
          </h2>
          <p className="text-lg text-center text-gray-700 mb-8">
            Less Tax, More Wealth
          </p>
          
          <div className="flex gap-4 justify-center mb-8">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg">
              세금시뮬레이터(Tax Simulator)
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
              은퇴준비상태진단
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-2">간편한 절차</h3>
              <p className="text-gray-600">세금 신고의 각 단계를 차례대로 안내해 드립니다.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-2">최대 공제 혜택</h3>
              <p className="text-gray-600">귀하가 받을 수 있는 모든 공제와 세액 공제를 찾아드립니다.</p>
            </div>
          </div>
        </main>
        
        <footer className="text-center mt-8 text-gray-500">
          <p>EzTax - 성공적으로 실행 중</p>
        </footer>
      </div>
    </div>
  );
}

export default App;