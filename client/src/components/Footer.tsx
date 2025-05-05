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
              EzTax helps individuals and families prepare and file their federal tax returns with confidence. 
              Our step-by-step process makes tax filing simple and stress-free.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-heading font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="#"><a className="hover:text-white">Tax Guides</a></Link></li>
                <li><Link href="#"><a className="hover:text-white">Tax Calculator</a></Link></li>
                <li><Link href="#"><a className="hover:text-white">Support Center</a></Link></li>
                <li><Link href="#"><a className="hover:text-white">Blog</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="#"><a className="hover:text-white">About Us</a></Link></li>
                <li><Link href="#"><a className="hover:text-white">Careers</a></Link></li>
                <li><Link href="#"><a className="hover:text-white">Press</a></Link></li>
                <li><Link href="#"><a className="hover:text-white">Contact</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-light">
                <li><Link href="#"><a className="hover:text-white">Privacy Policy</a></Link></li>
                <li><Link href="#"><a className="hover:text-white">Terms of Service</a></Link></li>
                <li><Link href="#"><a className="hover:text-white">Security</a></Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-gray-light flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} EzTax Inc. All rights reserved.</p>
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
