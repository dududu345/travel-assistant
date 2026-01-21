
import React, { useState, useRef, useEffect } from 'react';
import { chatWithGemini } from './geminiService';
import { Message } from './types';
import { PRESET_REGION_DATA, PRESET_STANDARD_DATA } from './constants';

const App: React.FC = () => {
  // 核心改动：如果本地存储没有，则直接使用代码里的预设数据
  const [regionData, setRegionData] = useState(() => localStorage.getItem('jinyao_region_data') || PRESET_REGION_DATA);
  const [standardData, setStandardData] = useState(() => localStorage.getItem('jinyao_standard_data') || PRESET_STANDARD_DATA);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '您好！我是津药差旅智能助手。系统已加载最新的政策数据库，您可以直接提问。例如：“我是达仁堂的中层，去上海出差标准是多少？”' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('jinyao_region_data', regionData);
  }, [regionData]);

  useEffect(() => {
    localStorage.setItem('jinyao_standard_data', standardData);
  }, [standardData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const result = await chatWithGemini(userMsg, regionData, standardData);
      setMessages(prev => [...prev, { role: 'assistant', content: result }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: '查询失败，请检查配置。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearToDefault = () => {
    if (window.confirm('确定要恢复到代码预设的初始数据吗？')) {
      setRegionData(PRESET_REGION_DATA);
      setStandardData(PRESET_STANDARD_DATA);
      localStorage.removeItem('jinyao_region_data');
      localStorage.removeItem('jinyao_standard_data');
    }
  };

  const getLineCount = (text: string) => text.split('\n').filter(l => l.trim()).length;

  return (
    <div className="flex h-screen max-w-6xl mx-auto bg-gray-100 sm:p-4 gap-4 font-sans text-gray-900">
      {/* Settings Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform ${showSettings ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 z-50 p-6 flex flex-col border-l border-gray-200`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-bold text-xl text-blue-900">数据预设与更新</h2>
            <p className="text-[10px] text-gray-400">您可以临时修改或恢复默认值</p>
          </div>
          <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-700">地区分类表</label>
              <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{getLineCount(regionData)} 行</span>
            </div>
            <textarea
              className="w-full h-32 border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white resize-none"
              value={regionData}
              onChange={(e) => setRegionData(e.target.value)}
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-700">差旅标准表</label>
              <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{getLineCount(standardData)} 行</span>
            </div>
            <textarea
              className="w-full h-48 border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-green-500 focus:outline-none bg-white resize-none"
              value={standardData}
              onChange={(e) => setStandardData(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 mt-4 space-y-3">
          <button 
            onClick={() => setShowSettings(false)}
            className="w-full bg-blue-800 text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition-all"
          >
            确认修改并返回
          </button>
          <button 
            onClick={clearToDefault}
            className="w-full bg-white text-gray-500 py-3 rounded-xl font-semibold border border-gray-100 hover:bg-gray-50 transition-all text-sm"
          >
            恢复代码预设数据
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white shadow-2xl overflow-hidden rounded-3xl border border-white">
        <header className="bg-gradient-to-r from-blue-950 to-indigo-900 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2.5 rounded-xl">
              <svg className="w-7 h-7 text-blue-300" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-black">津药差旅智能助手</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                <p className="text-blue-200 text-[10px] font-medium uppercase tracking-widest">Database Pre-loaded</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="bg-white/5 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-white/10"
          >
            查看/更新数据库
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
                m.role === 'user' ? 'bg-blue-700 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed text-sm">{m.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-4">
                <div className="flex gap-1 animate-pulse">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">查询政策中...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-6 bg-white border-t border-gray-100">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="请输入您的咨询..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-800 hover:bg-blue-900 disabled:opacity-30 text-white w-14 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
            >
              <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
          <p className="text-center text-gray-400 text-[10px] mt-2 italic">
            已成功加载津药集团内部差旅政策标准
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
