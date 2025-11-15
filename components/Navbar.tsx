
import React, { useState } from 'react';
import { Page } from '../types';
import HomeIcon from './icons/HomeIcon';
import DocumentReportIcon from './icons/DocumentReportIcon';
import CalendarIcon from './icons/CalendarIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import UsersIcon from './icons/UsersIcon';
import MenuIcon from './icons/MenuIcon';
import XIcon from './icons/XIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import MoonIcon from './icons/MoonIcon';
import SunIcon from './icons/SunIcon';

interface NavbarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const navItems = [
  { page: Page.HOME, label: 'Home', icon: HomeIcon },
  { page: Page.ABSEN_PIKET, label: 'Absen Piket', icon: ClipboardListIcon },
  { page: Page.LAPORAN_BENCANA, label: 'Laporan Bencana', icon: DocumentReportIcon },
  { page: Page.LAPORAN_KEGIATAN, label: 'Laporan Kegiatan', icon: CalendarIcon },
  { page: Page.SUSUNAN_PENGURUS, label: 'Susunan Pengurus', icon: UserGroupIcon },
  { page: Page.DATA_BASE_ANGGOTA, label: 'Database Anggota', icon: UsersIcon },
  { page: Page.PENGUMUMAN, label: 'Papan Info', icon: InformationCircleIcon },
  { page: Page.PANDUAN_DARURAT, label: 'Panduan Darurat', icon: ShieldCheckIcon },
];

const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage, theme, setTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button
      onClick={() => {
        setCurrentPage(item.page);
        setIsMenuOpen(false);
      }}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out ${
        currentPage === item.page
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-white'
      }`}
    >
      <item.icon className="w-5 h-5 mr-2" />
      {item.label}
    </button>
  );

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            {/* Judul dipindahkan ke halaman utama */}
          </div>
          <div className="flex items-center">
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => <NavLink key={item.page} item={item} />)}
              </div>
            </div>
             <button
              onClick={toggleTheme}
              className="ml-4 flex-shrink-0 p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
            </button>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? <XIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => <NavLink key={item.page} item={item} />)}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;