import React from 'react';

const Home: React.FC = () => {
  console.log("Home component rendering - simplified version");
  
  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          세상쉬운 세금계산 세상귀한 노후준비
        </h1>
        <p className="text-2xl font-bold text-gray-600 mb-4">
          Less Tax, More Wealth
        </p>
        <p className="text-xl text-gray-700 mb-8">
          세금시뮬레이터로 간단하게 계산하시고 노후준비도 진단하세요.
        </p>
        
        <div className="flex gap-4 justify-center">
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg">
            세금시뮬레이터(Tax Simulator)
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            은퇴준비상태진단
          </button>
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center mb-8">
          왜 EzTax인가요?
        </h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-2">간편한 절차</h3>
            <p className="text-gray-600">세금 신고의 각 단계를 차례대로 안내해 드립니다.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-2">최대 공제 혜택</h3>
            <p className="text-gray-600">귀하가 받을 수 있는 모든 공제와 세액 공제를 찾아드립니다.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-2">최적의 은퇴전략 제안</h3>
            <p className="text-gray-600">개인 맞춤형 은퇴 계획과 세금 최적화 전략을 제공합니다.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-2">안전하고 비공개적</h3>
            <p className="text-gray-600">귀하의 데이터는 은행 수준의 보안으로 암호화되고 보호됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;