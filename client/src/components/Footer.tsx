import React from 'react';
import Logo from './Logo';
import { Link } from 'wouter';
import { Facebook, Twitter, Instagram } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const Footer: React.FC = () => {
  const { messages } = useLanguage();
  
  return (
    <footer className="bg-primary-dark text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center mb-4">
              <Logo theme="dark" />
            </div>
            <p className="text-sm text-gray-light max-w-md">
              {messages.home.description}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-heading font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="/personal-info"><div className="hover:text-white cursor-pointer">{messages.home.taxSimulatorButton}</div></Link></li>
                <li><a href="https://www.ssa.gov/OACT/quickcalc/" target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer">{messages.footer.socialSecurityCalculator}</a></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">Customer Support</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">Blog</div></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="/about"><div className="hover:text-white cursor-pointer">{messages.footer.companyInfo}</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">Careers</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">Press</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">{messages.footer.contactUs}</div></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="#"><div className="hover:text-white cursor-pointer">{messages.footer.privacyPolicy}</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">{messages.footer.termsOfService}</div></Link></li>
                <li><Link href="#"><div className="hover:text-white cursor-pointer">Security</div></Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-gray-light flex flex-col md:flex-row justify-between items-center">
          <p>{messages.footer.copyright}</p>
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
