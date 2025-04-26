import { FiBell } from 'react-icons/fi';

const TopHead = ({ title }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 w-full sticky top-0 z-40 p-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <h1 className="text-[1.8rem] font-bold text-[#14467C]">{title}</h1>
        <div className="flex items-center space-x-4">
          <button className="relative text-[#14467c]-600 hover:text-[#14467C] focus:outline-none">
            <FiBell size={22} />
            {/* Optional notification dot */}
            {/* <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2"></span> */}
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopHead;
