import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import Game from './components/Game';
import Statistics from './components/Statistics';
import Leaderboard from './components/Leaderboard';
import Header from './components/Header';
import zhCN from 'antd/lib/locale/zh_CN';
import './App.css';

const { Content, Footer } = Layout;

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Layout className="layout">
          <Header />
          <Content className="main-content">
            <div className="site-layout-content">
              <Routes>
                <Route path="/" element={<Game />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Routes>
            </div>
          </Content>
          <Footer className="footer">
            Emoji猜词游戏 ©{new Date().getFullYear()}
          </Footer>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App; 