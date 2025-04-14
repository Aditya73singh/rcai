import React from 'react';
import { Link } from 'wouter';
import { Settings } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <svg className="h-8 w-8 text-reddit-orange" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2.833 15.825c-.115.063-.236.093-.357.093-.306 0-.591-.166-.733-.446l-2.727-5.394c-.147-.292-.102-.644.111-.886.214-.242.538-.334.839-.231l3.637 1.254c.34.117.568.431.568.786v4.188c0 .292-.155.562-.407.712.025-.015-.256.15-.276.162l-.655-.238zm9.565-6.52c-.024-.071-.06-.133-.107-.184-.048-.051-.104-.094-.166-.125-.063-.031-.13-.05-.199-.054-.069-.004-.137.004-.203.023l-6.994 2.019c-.383.11-.738-.121-.848-.501-.11-.381.119-.738.5-.848l6.993-2.019c.135-.042.278-.054.419-.037.14.017.275.062.396.132.121.07.227.164.311.277.084.112.143.24.176.376.154.525-.15 1.076-.673 1.232l-.106.032-.043-.148.043.148c-.056.016-.107.036-.157.052-.05.017-.207.059-.337.094.087-.05.167-.114.234-.19.066-.075.118-.162.154-.255l.019-.063c.198-.573-.156-1.179-.757-1.344-.602-.166-1.229.142-1.428.715l-.018.064c-.034.101-.05.206-.047.312.003.107.026.211.069.309.172.384.642.503 1.049.266l5.447-3.328c.309-.189.705-.177.999.033.295.209.426.58.331.926l-1.499 5.49c-.096.35-.394.594-.757.618-.362.024-.688-.178-.827-.515l-2.248-5.449c-.136-.331-.48-.497-.812-.393-.333.104-.526.441-.456.782l1.635 7.794c.064.305.011.62-.153.888-.163.268-.418.472-.713.572l-.063.021c-.285.097-.602.085-.889-.035-.287-.119-.513-.347-.636-.634l-2.286-5.298c-.138-.319-.483-.475-.814-.366-.331.11-.523.452-.449.79l1.146 5.337c.071.332-.086.666-.368.836z"/>
              </svg>
              <span className="ml-2 text-xl font-semibold text-gray-900">Reddit Comment Search</span>
            </Link>
          </div>
          <div className="ml-4 flex items-center md:ml-6">
            <button type="button" className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-reddit-orange">
              <span className="sr-only">View settings</span>
              <Settings className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
