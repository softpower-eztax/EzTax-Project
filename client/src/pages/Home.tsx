import React from 'react';

const Home: React.FC = () => {
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
        
        <div className="flex gap-4 justify-center mb-12">
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg">
            세금시뮬레이터(Tax Simulator)
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            은퇴준비상태진단
          </button>
        </div>
      </div>
      
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-8">
          왜 EzTax인가요?
        </h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-10 w-10 bg-blue-500 rounded mb-4"></div>
            <h3 className="text-lg font-bold mb-2">간편한 절차</h3>
            <p className="text-gray-600">세금 신고의 각 단계를 차례대로 안내해 드립니다.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-10 w-10 bg-green-500 rounded mb-4"></div>
            <h3 className="text-lg font-bold mb-2">최대 공제 혜택</h3>
            <p className="text-gray-600">귀하가 받을 수 있는 모든 공제와 세액 공제를 찾아드립니다.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-10 w-10 bg-purple-500 rounded mb-4"></div>
            <h3 className="text-lg font-bold mb-2">최적의 은퇴전략 제안</h3>
            <p className="text-gray-600">개인 맞춤형 은퇴 계획과 세금 최적화 전략을 제공합니다.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-10 w-10 bg-orange-500 rounded mb-4"></div>
            <h3 className="text-lg font-bold mb-2">안전하고 비공개적</h3>
            <p className="text-gray-600">귀하의 데이터는 은행 수준의 보안으로 암호화되고 보호됩니다.</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-4">세금 신고 준비가 되셨나요?</h2>
        <p className="text-center text-gray-600 mb-6">
          30분 만에 2025년 세금 신고를 완료하세요.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>개인 정보</strong> - 기본 정보 및 신고 상태</li>
            <li><strong>소득 정보</strong> - 급여, 이자, 기타 소득 입력</li>
            <li><strong>공제 항목</strong> - 표준 공제 또는 항목별 공제 선택</li>
          </ol>
          <ol className="list-decimal pl-6 space-y-2" start={4}>
            <li><strong>세액 공제</strong> - 자격이 있는 공제 항목 확인</li>
            <li><strong>추가 세금</strong> - 자영업 및 기타 소득</li>
            <li><strong>검토 및 계산</strong> - 최종 확인 및 신고서 생성</li>
          </ol>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg">
            지금 시작하기
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg">
            세금시뮬레이터(Tax Simulator)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;