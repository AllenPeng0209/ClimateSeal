import React, { useEffect, useRef, useState } from 'react';
import { Layout, Button, Typography, Row, Col, Card, Menu, Dropdown, Space, Divider, Form } from 'antd';
import { Link, useNavigate } from '@remix-run/react';
import {
    BulbOutlined,
    LineChartOutlined,
    ExperimentOutlined,
    ProfileOutlined,
    GlobalOutlined,
    CloudUploadOutlined,
    RobotOutlined,
    FundViewOutlined,
    EyeOutlined,
    AimOutlined,
    CheckCircleOutlined,
    TeamOutlined,
    UserOutlined,
    DownOutlined,
    FileProtectOutlined,
    AppstoreOutlined,
    BarChartOutlined,
    HomeOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    GithubOutlined,
    LinkedinOutlined,
    TwitterOutlined,
    FacebookOutlined,
    ArrowRightOutlined,
    QuestionCircleOutlined,
    MenuOutlined,
} from '@ant-design/icons';
import { ClientOnly } from 'remix-utils/client-only';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<number>(0);
    const [isScrolling, setIsScrolling] = useState<boolean>(false);
    const [menuVisible, setMenuVisible] = useState<boolean>(false);
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const sections = Array.from(document.querySelectorAll('.fullscreen-section'));
        sectionRefs.current = sections as (HTMLDivElement | null)[];
        
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i] as HTMLDivElement;
                if (!section) continue;
                
                const sectionTop = section.offsetTop - 100;
                const sectionBottom = sectionTop + section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    setActiveSection(i);
                    break;
                }
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleWheel = (e: Event) => {
            const wheelEvent = e as WheelEvent;
            
            if (activeSection === sectionRefs.current.length - 1 && wheelEvent.deltaY > 0) {
                return;
            }
            
            e.preventDefault();
            
            if (isScrolling) return;
            
            setIsScrolling(true);
            
            const direction = wheelEvent.deltaY > 0 ? 1 : -1;
            const nextSection = Math.min(Math.max(activeSection + direction, 0), sectionRefs.current.length - 1);
            
            if (nextSection !== activeSection) {
                const nextSectionEl = sectionRefs.current[nextSection];
                if (nextSectionEl) {
                    nextSectionEl.scrollIntoView({
                        behavior: 'smooth'
                    });
                    
                    setActiveSection(nextSection);
                }
            }
            
            setTimeout(() => {
                setIsScrolling(false);
            }, 800);
        };
        
        const sections = document.querySelectorAll('.fullscreen-section');
        sections.forEach(section => {
            section.addEventListener('wheel', handleWheel, { passive: false });
        });
        
        return () => {
            sections.forEach(section => {
                section.removeEventListener('wheel', handleWheel);
            });
        };
    }, [activeSection, isScrolling]);

    const scrollToNextSection = () => {
        if (activeSection < sectionRefs.current.length - 1) {
            const nextSection = sectionRefs.current[activeSection + 1];
            if (nextSection) {
                nextSection.scrollIntoView({
                    behavior: 'smooth'
                });
                setActiveSection(activeSection + 1);
            }
        }
    };

    const menuItems = [
        {
            key: 'product',
            label: '产品',
            children: [
                {
                    key: 'carbon-footprint',
                    label: '智碳云- AI碳顾问',
                },
            ],
        },
        {
            key: 'solutions',
            label: '解决方案',
            children: [
                {
                    key: 'manufacturing',
                    label: '制造业',
                },
                {
                    key: 'retail',
                    label: '零售业',
                },
                {
                    key: 'finance',
                    label: '金融业',
                },
                {
                    key: 'logistics',
                    label: '物流业',
                },
                {
                    key: 'energy',
                    label: '能源业',
                },
            ],
        },
        {
            key: 'pricing',
            label: '价格',
        },
        {
            key: 'resources',
            label: '资源',
            children: [
                {
                    key: 'blog',
                    label: '博客',
                },
                {
                    key: 'case-studies',
                    label: '案例研究',
                },
                {
                    key: 'whitepapers',
                    label: '白皮书',
                },
                {
                    key: 'webinars',
                    label: '网络研讨会',
                },
            ],
        },
        {
            key: 'about',
            label: '关于我们',
            children: [
                {
                    key: 'team',
                    label: '团队介绍',
                },
                {
                    key: 'contact',
                    label: '联系方式',
                },
                {
                    key: 'partners',
                    label: '合作伙伴',
                },
            ],
        },
    ];

    const languageOptions = [
        {
            key: 'zh-tw',
            label: '繁体中文',
        },
        {
            key: 'zh-cn',
            label: '简体中文',
        },
        {
            key: 'en',
            label: 'English',
        },
        {
            key: 'ja',
            label: '日本语',
        },
        {
            key: 'ko',
            label: '한국어',
        },
        {
            key: 'es',
            label: 'Español',
        },
        {
            key: 'fr',
            label: 'Français',
        },
        {
            key: 'de',
            label: 'Deutsch',
        },  
        {
            key: 'it',
            label: 'Italiano',
        },
        {
            key: 'nl',  
            label: 'Nederlands',
        },
        {
            key: 'pl',
            label: 'Polski',
        },  
        {
            key: 'pt',
            label: 'Português',
        },
    ];

    const handleMenuClick = (e: { key: string }) => {
        console.log('Menu clicked: ', e.key);
        // 实际应用中可以根据 key 导航到不同页面
    };

    const toggleMobileMenu = () => {
        setMenuVisible(!menuVisible);
    };

    return (
        <Layout className="landing-page-layout">
            <Header className="landing-header">
                <div className="header-left">
                    <div className="logo">
                        <img src="/logo.svg" alt="Climate Seal Logo" />
                        <span className="logo-text">Climate Seal</span>
                    </div>
                    <div className="desktop-menu">
                        <Menu
                            mode="horizontal"
                            items={menuItems}
                            onClick={handleMenuClick}
                            className="main-menu"
                        />
                    </div>
                </div>
                <div className="header-right">
                    <Dropdown
                        menu={{
                            items: languageOptions,
                            onClick: handleMenuClick,
                        }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <Button type="text" className="language-selector">
                            <GlobalOutlined /> <DownOutlined />
                        </Button>
                    </Dropdown>
                    <Button type="primary" className="login-button" onClick={() => navigate('/login')}>
                        登录
                    </Button>
                    <Button type="text" className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                        <MenuOutlined />
                    </Button>
                </div>
                {menuVisible && (
                    <div className="mobile-menu">
                        <Menu
                            mode="inline"
                            items={menuItems}
                            onClick={handleMenuClick}
                            className="main-menu-mobile"
                        />
                    </div>
                )}
            </Header>

            <Content className="landing-content">
                <div ref={el => sectionRefs.current[0] = el} className="fullscreen-section hero-section" data-section="hero">
                    <video className="video-background" autoPlay loop muted playsInline>
                        <source src="/images/856478-uhd_4096_2160_25fps.mp4" type="video/mp4" />
                    </video>
                    <div className="tech-bubbles">
                        <div className="bubble bubble-1"></div>
                        <div className="bubble bubble-2"></div>
                        <div className="bubble bubble-3"></div>
                        <div className="bubble bubble-4"></div>
                        <div className="bubble bubble-5"></div>
                        <div className="bubble bubble-6"></div>
                    </div>
                    <div className="section-content">
                        <div className="hero-text">
                            <Title level={1} className="hero-title">
                                Climate Seal
                            </Title>
                            <div className="hero-subtitle">ESG智能碳顾问平台</div>
                            <Paragraph className="hero-description">
                                利用尖端AI碳顾问和可信碳因子数据，帮助企业应对气候与ESG挑战，
                                规划实施高效的净零转型方案，实现可持续发展目标。
                            </Paragraph>
                            <div className="hero-buttons">
                                <Button type="primary" size="large" className="hero-cta-button" onClick={() => navigate('/register')}>
                                    开始使用
                                </Button>
                                <Button type="default" size="large" className="hero-secondary-button" onClick={scrollToNextSection}>
                                    了解更多
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="scroll-indicator" onClick={scrollToNextSection}>
                        <DownOutlined />
                    </div>
                </div>

                <div ref={el => sectionRefs.current[1] = el} className="fullscreen-section how-it-works-section" data-section="how-it-works">
                    <div className="tech-bubbles">
                        <div className="bubble bubble-1"></div>
                        <div className="bubble bubble-2"></div>
                        <div className="bubble bubble-3"></div>
                        <div className="bubble bubble-4"></div>
                        <div className="bubble bubble-5"></div>
                        <div className="bubble bubble-6"></div>
                    </div>
                    <div className="section-content">
                        <Title level={2} className="section-title">四步开始使用</Title>
                        <Row gutter={[32, 32]} className="process-steps">
                            <Col xs={24} md={6}>
                                <div className="process-step">
                                    <div className="step-number">1</div>
                                    <div className="step-icon">
                                        <RobotOutlined />
                                    </div>
                                    <Title level={3}>打开AI碳顾问</Title>
                                    <Paragraph className="step-description">
                                        登录平台后，直接访问智能AI碳顾问功能，它将全程指导您完成碳排放分析流程。
                                    </Paragraph>
                                </div>
                            </Col>
                            <Col xs={24} md={6}>
                                <div className="process-step">
                                    <div className="step-number">2</div>
                                    <div className="step-icon">
                                        <CloudUploadOutlined />
                                    </div>
                                    <Title level={3}>上传BOM表</Title>
                                    <Paragraph className="step-description">
                                        导入您的物料清单(BOM)数据，系统会自动识别关键组件并匹配碳排放因子数据库。
                                    </Paragraph>
                                </div>
                            </Col>
                            <Col xs={24} md={6}>
                                <div className="process-step">
                                    <div className="step-number">3</div>
                                    <div className="step-icon">
                                        <AppstoreOutlined />
                                    </div>
                                    <Title level={3}>完善报告数据</Title>
                                    <Paragraph className="step-description">
                                        根据AI顾问的智能提示，补充必要信息并利用可信碳因子数据库验证分析结果的准确性。
                                    </Paragraph>
                                </div>
                            </Col>
                            <Col xs={24} md={6}>
                                <div className="process-step">
                                    <div className="step-number">4</div>
                                    <div className="step-icon">
                                        <FileProtectOutlined />
                                    </div>
                                    <Title level={3}>生成碳排放报告</Title>
                                    <Paragraph className="step-description">
                                        获取符合国际标准的全面碳排放分析报告，包含详细数据图表和科学减排建议。
                                    </Paragraph>
                                </div>
                            </Col>
                        </Row>
                    </div>
                    <div className="scroll-indicator" onClick={scrollToNextSection}>
                        <DownOutlined />
                    </div>
                </div>

                <div ref={el => sectionRefs.current[2] = el} className="fullscreen-section features-section" data-section="features">
                    <div className="tech-bubbles">
                        <div className="bubble bubble-1"></div>
                        <div className="bubble bubble-2"></div>
                        <div className="bubble bubble-3"></div>
                        <div className="bubble bubble-4"></div>
                        <div className="bubble bubble-5"></div>
                        <div className="bubble bubble-6"></div>
                    </div>
                    <div className="section-content">
                        <Title level={2} className="section-title">核心功能</Title>
                        <div className="features-grid">
                            <Row gutter={[24, 24]} className="features-grid">
                                <Col xs={24} sm={12} lg={8}>
                                    <Card className="feature-card">
                                        <div className="feature-icon-wrapper">
                                            <FileProtectOutlined className="feature-icon" />
                                        </div>
                                        <div className="feature-content">
                                            <Title level={3}>ESG绩效分析</Title>
                                            <Paragraph className="feature-description">
                                                全面分析企业的环境、社会和治理表现，识别优势和改进空间。
                                            </Paragraph>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={8}>
                                    <Card className="feature-card">
                                        <div className="feature-icon-wrapper">
                                            <BarChartOutlined className="feature-icon" />
                                        </div>
                                        <div className="feature-content">
                                            <Title level={3}>碳足迹计算</Title>
                                            <Paragraph className="feature-description">
                                                精确计算企业的范畴1-3碳排放，并提供减排路径和成本效益分析。
                                            </Paragraph>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={8}>
                                    <Card className="feature-card">
                                        <div className="feature-icon-wrapper">
                                            <AppstoreOutlined className="feature-icon" />
                                        </div>
                                        <div className="feature-content">
                                            <Title level={3}>合规追踪</Title>
                                            <Paragraph className="feature-description">
                                                监控最新的ESG法规和报告要求，确保您的企业始终符合标准。
                                            </Paragraph>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={8}>
                                    <Card className="feature-card">
                                        <div className="feature-icon-wrapper">
                                            <TeamOutlined className="feature-icon" />
                                        </div>
                                        <div className="feature-content">
                                            <Title level={3}>供应链分析</Title>
                                            <Paragraph className="feature-description">
                                                评估供应链的可持续性和ESG风险，提供优化建议。
                                            </Paragraph>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={8}>
                                    <Card className="feature-card">
                                        <div className="feature-icon-wrapper">
                                            <BarChartOutlined className="feature-icon" />
                                        </div>
                                        <div className="feature-content">
                                            <Title level={3}>情景分析</Title>
                                            <Paragraph className="feature-description">
                                                模拟不同气候和政策情景下的业务影响，提前做好风险管理。
                                            </Paragraph>
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={8}>
                                    <Card className="feature-card">
                                        <div className="feature-icon-wrapper">
                                            <FileProtectOutlined className="feature-icon" />
                                        </div>
                                        <div className="feature-content">
                                            <Title level={3}>报告生成</Title>
                                            <Paragraph className="feature-description">
                                                自动生成符合GRI、TCFD、SASB等标准的ESG报告，节省时间和资源。
                                            </Paragraph>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    </div>
                    <div className="scroll-indicator" onClick={scrollToNextSection}>
                        <DownOutlined />
                    </div>
                </div>

                <div ref={el => sectionRefs.current[3] = el} className="fullscreen-section benefits-section" data-section="benefits">
                    <div className="tech-bubbles">
                        <div className="bubble bubble-1"></div>
                        <div className="bubble bubble-2"></div>
                        <div className="bubble bubble-3"></div>
                        <div className="bubble bubble-4"></div>
                        <div className="bubble bubble-5"></div>
                        <div className="bubble bubble-6"></div>
                    </div>
                    <div className="section-content">
                        <Title level={2} className="section-title">使用价值</Title>
                        <Row gutter={[32, 32]} className="benefits-container">
                            <Col xs={24} md={12} lg={8}>
                                <div className="benefit-item">
                                    <div className="benefit-content">
                                        <div className="benefit-icon">
                                            <BarChartOutlined />
                                        </div>
                                        <Title level={3}>降低成本</Title>
                                        <Paragraph className="benefit-description">
                                            通过识别资源使用效率低下的环节和过程，帮助企业降低运营成本。
                                        </Paragraph>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} md={12} lg={8}>
                                <div className="benefit-item">
                                    <div className="benefit-content">
                                        <div className="benefit-icon">
                                            <TeamOutlined />
                                        </div>
                                        <Title level={3}>提升声誉</Title>
                                        <Paragraph className="benefit-description">
                                            积极的ESG表现可增强品牌形象，吸引投资者、客户和人才。
                                        </Paragraph>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} md={12} lg={8}>
                                <div className="benefit-item">
                                    <div className="benefit-content">
                                        <div className="benefit-icon">
                                            <FileProtectOutlined />
                                        </div>
                                        <Title level={3}>降低风险</Title>
                                        <Paragraph className="benefit-description">
                                            预先识别和管理气候变化相关的物理和转型风险，增强业务韧性。
                                        </Paragraph>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} md={12} lg={8}>
                                <div className="benefit-item">
                                    <div className="benefit-content">
                                        <div className="benefit-icon">
                                            <AppstoreOutlined />
                                        </div>
                                        <Title level={3}>促进创新</Title>
                                        <Paragraph className="benefit-description">
                                            发现可持续发展机会，推动产品和服务创新，开拓新市场。
                                        </Paragraph>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} md={12} lg={8}>
                                <div className="benefit-item">
                                    <div className="benefit-content">
                                        <div className="benefit-icon">
                                            <BarChartOutlined />
                                        </div>
                                        <Title level={3}>简化合规</Title>
                                        <Paragraph className="benefit-description">
                                            自动化的合规追踪和报告流程，减轻合规负担，降低违规风险。
                                        </Paragraph>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} md={12} lg={8}>
                                <div className="benefit-item">
                                    <div className="benefit-content">
                                        <div className="benefit-icon">
                                            <TeamOutlined />
                                        </div>
                                        <Title level={3}>提高效率</Title>
                                        <Paragraph className="benefit-description">
                                            数据自动收集和分析，节省大量人力和时间成本，提高决策效率。
                                        </Paragraph>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                    <div className="scroll-indicator" onClick={scrollToNextSection}>
                        <DownOutlined />
                    </div>
                </div>

                <div ref={el => sectionRefs.current[4] = el} className="fullscreen-section cta-section" data-section="cta">
                    <div className="tech-bubbles">
                        <div className="bubble bubble-1"></div>
                        <div className="bubble bubble-2"></div>
                        <div className="bubble bubble-3"></div>
                        <div className="bubble bubble-4"></div>
                        <div className="bubble bubble-5"></div>
                        <div className="bubble bubble-6"></div>
                    </div>
                    <div className="section-content">
                        <div className="cta-container">
                            <Title level={2} className="cta-title">准备好开始您的可持续发展之旅了吗？</Title>
                            <Paragraph className="cta-description">
                                加入我们平台，与数千家企业一起，通过数据驱动的方法应对气候挑战，把握绿色机遇。
                            </Paragraph>
                            <div className="cta-buttons">
                                <Button type="primary" className="cta-button main-cta" onClick={() => navigate('/register')}>
                                    立即注册
                                </Button>
                                <Button className="cta-button secondary-cta" onClick={() => navigate('/about')}>
                                    了解更多
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div 
                        className="scroll-indicator scroll-to-footer" 
                        onClick={() => {
                            window.scrollTo({
                                top: document.documentElement.scrollHeight,
                                behavior: 'smooth'
                            });
                        }}
                    >
                        <DownOutlined />
                        <span className="footer-hint">查看底部</span>
                    </div>
                </div>
            </Content>

            <Footer className="landing-footer">
                <div className="footer-content">
                    <Row gutter={[48, 32]}>
                        <Col xs={24} sm={12} md={6} lg={6}>
                            <div className="footer-section">
                                <div className="footer-logo">
                                    <img src="/logo.svg" alt="气候印信 Logo" />
                                </div>
                                <div className="footer-contact">
                                    <p>400-80-88888</p>
                                    <p>mail@climateseal.com</p>
                                    <p>上海市浦东新区</p>
                                </div>
                            </div>
                        </Col>
                        
                        <Col xs={24} sm={12} md={6} lg={4}>
                            <div className="footer-section">
                                <Title level={4} className="footer-title">碳管理软件</Title>
                                <ul className="footer-links">
                                    <li><a href="#">智碳云平台</a></li>
                                    <li><a href="#">中国碳计算因子库</a></li>
                                </ul>
                            </div>
                        </Col>
                        
                        <Col xs={24} sm={12} md={6} lg={4}>
                            <div className="footer-section">
                                <Title level={4} className="footer-title mt-4">碳资讯</Title>
                                <ul className="footer-links">
                                    <li><a href="#">行業新聞</a></li>
                                    <li><a href="#">政策解读</a></li>
                                    <li><a href="#">技术动态</a></li>
                                    <li><a href="#">行业报告</a></li>
                                    <li><a href="#">碳市场动态</a></li>
                                    <li><a href="#">碳交易市场</a></li>
                                    <li><a href="#">碳排放权交易</a></li>
                                </ul>
                            </div>
                        </Col>
                        
                        <Col xs={24} sm={12} md={6} lg={4}>
                            <div className="footer-section">
                                <Title level={4} className="footer-title">解决方案</Title>
                                <ul className="footer-links">
                                    <li><a href="#">石化行业碳排方案</a></li>
                                    <li><a href="#">物流行业碳排方案</a></li>
                                    <li><a href="#">食品饮料行业碳排方案</a></li>
                                    <li><a href="#">金融机构碳排方案</a></li>
                                    <li><a href="#">科技公司碳排方案</a></li>
                                    <li><a href="#">制造业碳排方案</a></li>
                                    <li><a href="#">建筑行业碳排方案</a></li>
                                    <li><a href="#">电力行业碳排方案</a></li>
                                    <li><a href="#">其他行业碳排方案</a></li>
                                </ul>
                            </div>
                        </Col>
                        
                        <Col xs={24} sm={12} md={6} lg={6}>
                            <div className="footer-section">
                                <Title level={4} className="footer-title">关于我们</Title>
                                <ul className="footer-links">
                                    <li><a href="#">公司介绍</a></li>
                                    <li><a href="#">联络我们</a></li>
                                    <li><a href="#">碳中和实践</a></li>
                                </ul>
                            </div>
                        </Col>
                    </Row>
                    
                    <div className="footer-qrcode-section">
                        <Row gutter={[16, 16]} className="footer-qrcode-row">
                            <Col xs={6} sm={6} md={6}>
                                <div className="qrcode-item">
                                    <img src="/images/qrcode/qrcode1.png" alt="气候印信公众号" />
                                    <p>气候印信公众号</p>
                                </div>
                            </Col>
                            <Col xs={6} sm={6} md={6}>
                                <div className="qrcode-item">
                                    <img src="/images/qrcode/qrcode2.png" alt="气候印信订阅号" />
                                    <p>气候印信订阅号</p>
                                </div>
                            </Col>
                            <Col xs={6} sm={6} md={6}>
                                <div className="qrcode-item">
                                    <img src="/images/qrcode/qrcode3.png" alt="气候印信小程序" />
                                    <p>气候印信小程序</p>
                                </div>
                            </Col>
                            <Col xs={6} sm={6} md={6}>
                                <div className="qrcode-item">
                                    <img src="/images/qrcode/qrcode4.png" alt="私信老板" />
                                    <p>私信老板</p>
                                </div>
                            </Col>
                        </Row>
                    </div>
                    
                    <div className="footer-partners">
                        <div className="partners-title">授权机构：</div>
                        <div className="partners-logos">
                            <img src="/images/partners/partner1.png" alt="CDP" />
                            <img src="/images/partners/partner2.png" alt="IPCC" />
                            <img src="/images/partners/partner3.png" alt="Gartner" />
                            <img src="/images/partners/partner4.png" alt="ecoInvent" />
                            <img src="/images/partners/partner5.png" alt="SGS" />
                            <img src="/images/partners/partner6.png" alt="其他合作方" />
                        </div>
                    </div>
                    
                    <div className="footer-partners">
                        <div className="partners-title">友情链接：</div>
                        <div className="partners-text">
                            <a href="#">碳交易市场联盟</a>
                            <a href="#">外科公众联盟会</a>
                            <a href="#">CDP中国样板气候研讨中心</a>
                            <a href="#">联合国机构</a>
                            <a href="#">世界自然保护基金会（WWF）</a>
                            <a href="#">中国绿色碳汇基金会</a>
                        </div>
                    </div>
                </div>
                <Divider className="footer-divider" />
                <div className="footer-bottom">
                    <div className="copyright">
                        <p>Copyright 2011-2024 北京气候印信有限公司科技有限公司</p>
                        <p>京ICP备案 1101102039171xx号</p>
                        <p>京公网安备 110105660678-xx</p>
                    </div>
                </div>
            </Footer>
        </Layout>
    );
}; 