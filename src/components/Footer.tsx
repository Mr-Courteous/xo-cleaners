import React from 'react';
import { Shirt } from 'lucide-react';
import { ColorsScope } from '../state/ColorsContext';

interface FooterProps {
    primaryColor?: string;
}

const Footer: React.FC<FooterProps> = ({ primaryColor = '#2563eb' }) => {
    return (
        <ColorsScope>
        <footer className="bg-white border-t border-gray-200 py-8 px-4 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-2">
                    <div style={{ backgroundColor: 'var(--primary-color)' }} className="p-1.5 rounded-lg">
                        <Shirt className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-gray-800">XoCleaners</span>
                </div>
                
                <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} XoCleaners. All rights reserved.
                </p>
                
                <div className="flex space-x-6 text-sm text-gray-500">
                    <a href="#" className="hover:text-primary">Privacy Policy</a>
                    <a href="#" className="hover:text-primary">Terms of Service</a>
                </div>
            </div>
        </footer>
        </ColorsScope>
    );
};

export default Footer;