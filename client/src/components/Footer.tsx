import React from 'react';
import Logo from './Logo';
import { Link } from 'wouter';
import { Facebook, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-dark text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center mb-4">
              <Logo theme="dark" />
            </div>
            <p className="text-sm text-gray-light max-w-md">
              EzTax는 개인과 가족이 자신감을 가지고 연방세 신고서를 준비하고 제출할 수 있도록 도와드립니다.
              저희의 간단한 과정을 통해 세금 신고가 쉽고 스트레스 없이 가능합니다.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-heading font-semibold mb-4">리소스</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="#"><div className="hover:text-white cursor-pointer">세금 가이드</div></Link></li>
                <li><a href="https://www.ssa.gov/OACT/quickcalc/" target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer">Social Security 계산기</a></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">고객 지원 센터</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">블로그</div></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">회사 소개</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="/about"><div className="hover:text-white cursor-pointer">회사 소개</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">채용 정보</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">보도 자료</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">문의하기</div></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">법률</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="#"><div className="hover:text-white cursor-pointer">개인정보 처리방침</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">서비스 이용약관</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">보안</div></Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-gray-light flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} EzTax Inc. 모든 권리 보유.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <a href="#" className="hover:text-white">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-white">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-white">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
