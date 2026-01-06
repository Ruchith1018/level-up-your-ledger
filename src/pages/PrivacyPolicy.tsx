import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, FileText, Server, Globe } from "lucide-react";

/**
 * Enterprise-Grade Privacy Policy Component
 * Detailed data protection and privacy standards.
 */
const PrivacyPolicy = () => {
    const navigate = useNavigate();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Navigation Header */}
            <div className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center max-w-7xl mx-auto px-4 sm:px-6">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="w-4 h-4" />
                        <span>Trust & Safety</span>
                    </div>
                </div>
            </div>

            <main className="container max-w-5xl mx-auto px-4 sm:px-6 py-12">

                {/* Document Header */}
                <div className="mb-16 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/20 mb-4">
                        <Lock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        We value your trust. This document outlines how we collect, use, and protect your personal data when you use our Service.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        <Eye className="w-3 h-3 text-blue-500" />
                        Last Revised: January 6, 2026
                    </div>
                </div>

                <div className="grid gap-12 lg:grid-cols-[1fr_300px] relative">

                    {/* Main Legal Text */}
                    <div className="space-y-16 text-lg leading-relaxed text-foreground/80">

                        {/* 1. Introduction */}
                        <section id="introduction" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">1. Introduction</h2>
                            <p>
                                This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
                            </p>
                            <p>
                                We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.
                            </p>
                        </section>

                        {/* 2. Definitions */}
                        <section id="definitions" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">2. Interpretation and Definitions</h2>
                            <h3 className="text-xl font-semibold text-foreground">Definitions</h3>
                            <ul className="list-disc pl-6 space-y-3 marker:text-muted-foreground">
                                <li><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</li>
                                <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to BudGlio Inc.</li>
                                <li><strong>Cookies</strong> are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses.</li>
                                <li><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</li>
                                <li><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.</li>
                                <li><strong>Service</strong> refers to the Application or the Website or both.</li>
                                <li><strong>Service Provider</strong> means any natural or legal person who processes the data on behalf of the Company.</li>
                                <li><strong>Usage Data</strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).</li>
                            </ul>
                        </section>

                        {/* 3. Data Collection */}
                        <section id="collection" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">3. Collecting and Using Your Personal Data</h2>

                            <h3 className="text-xl font-semibold text-foreground">Types of Data Collected</h3>

                            <div className="bg-muted/30 p-6 rounded-xl space-y-4 border border-border/50">
                                <h4 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> Personal Data</h4>
                                <p className="text-base">
                                    While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:
                                </p>
                                <ul className="list-disc pl-6 space-y-1 text-base">
                                    <li>Email address</li>
                                    <li>First name and last name</li>
                                    <li>Phone number</li>
                                    <li>Usage Data</li>
                                </ul>
                            </div>

                            <div className="bg-muted/30 p-6 rounded-xl space-y-4 border border-border/50 mt-4">
                                <h4 className="font-bold flex items-center gap-2"><Server className="w-4 h-4" /> Usage Data</h4>
                                <p className="text-base">
                                    Usage Data is collected automatically when using the Service. It may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.
                                </p>
                            </div>
                        </section>

                        {/* 4. Use of Data */}
                        <section id="usage" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">4. Use of Your Personal Data</h2>
                            <p>The Company may use Personal Data for the following purposes:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>To provide and maintain our Service</strong>, including to monitor the usage of our Service.</li>
                                <li><strong>To manage Your Account:</strong> to manage Your registration as a user of the Service.</li>
                                <li><strong>For the performance of a contract:</strong> the development, compliance and undertaking of the purchase contract for the products, items or services You have purchased or of any other contract with Us through the Service.</li>
                                <li><strong>To contact You:</strong> To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication.</li>
                                <li><strong>To manage Your requests:</strong> To attend and manage Your requests to Us.</li>
                            </ul>
                        </section>

                        {/* 5. Retention & Transfer */}
                        <section id="retention" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">5. Retention and Transfer of Data</h2>
                            <p>
                                The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
                            </p>
                            <p>
                                Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to — and maintained on — computers located outside of Your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from Your jurisdiction.
                            </p>
                        </section>

                        {/* 6. Disclosure */}
                        <section id="disclosure" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">6. Disclosure of Your Personal Data</h2>

                            <h3 className="text-xl font-semibold text-foreground">Business Transactions</h3>
                            <p>
                                If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-4">Law enforcement</h3>
                            <p>
                                Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).
                            </p>
                        </section>

                        {/* 7. Security */}
                        <section id="security" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">7. Security of Your Personal Data</h2>
                            <p>
                                The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.
                            </p>
                        </section>

                        {/* 8. Children's Privacy */}
                        <section id="children" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">8. Children's Privacy</h2>
                            <p>
                                Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us. If We become aware that We have collected Personal Data from anyone under the age of 13 without verification of parental consent, We take steps to remove that information from Our servers.
                            </p>
                        </section>

                        {/* 9. Links to Other Websites */}
                        <section id="links" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">9. Links to Other Websites</h2>
                            <p>
                                Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit.
                            </p>
                            <p>
                                We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
                            </p>
                        </section>

                        {/* 10. Changes */}
                        <section id="changes" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">10. Changes to this Privacy Policy</h2>
                            <p>
                                We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.
                            </p>
                            <p>
                                We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last Revised" date at the top of this Privacy Policy.
                            </p>
                        </section>



                    </div>

                    {/* Sidebar / Floater (Desktop) */}
                    <div className="hidden lg:block relative">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                                <h3 className="font-bold text-lg mb-4">Content Navigation</h3>
                                <nav className="flex flex-col space-y-2 text-sm text-muted-foreground">
                                    <a href="#introduction" className="hover:text-primary transition-colors">1. Introduction</a>
                                    <a href="#definitions" className="hover:text-primary transition-colors">2. Definitions</a>
                                    <a href="#collection" className="hover:text-primary transition-colors">3. Data Collection</a>
                                    <a href="#usage" className="hover:text-primary transition-colors">4. Use of Data</a>
                                    <a href="#retention" className="hover:text-primary transition-colors">5. Retention</a>
                                    <a href="#disclosure" className="hover:text-primary transition-colors">6. Disclosure</a>
                                    <a href="#security" className="hover:text-primary transition-colors">7. Security</a>
                                    <a href="#children" className="hover:text-primary transition-colors">8. Children's Privacy</a>
                                    <a href="#links" className="hover:text-primary transition-colors">9. External Links</a>
                                    <a href="#changes" className="hover:text-primary transition-colors">10. Changes</a>

                                </nav>
                            </div>
                            <Button className="w-full rounded-full" onClick={() => window.close()}>
                                Close Policy
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Bar */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur border-t border-border/10">
                    <Button className="w-full rounded-full shadow-lg" size="lg" onClick={() => window.close()}>
                        Close Policy
                    </Button>
                </div>

            </main>
        </div>
    );
};

export default PrivacyPolicy;
