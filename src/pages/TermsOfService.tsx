import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ScrollText, ArrowLeft, Shield, Scale, Verified } from "lucide-react";

/**
 * Enterprise-Grade Terms of Service Component
 * Designed for maximum legal coverage and clarity.
 */
const TermsOfService = () => {
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
                        <span>Legal Center</span>
                    </div>
                </div>
            </div>

            <main className="container max-w-5xl mx-auto px-4 sm:px-6 py-12">

                {/* Document Header */}
                <div className="mb-16 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
                        <Scale className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Please read these terms and conditions carefully before using Our Service. This is a legally binding contract.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        <Verified className="w-3 h-3 text-green-500" />
                        Last Revised: January 6, 2026
                    </div>
                </div>

                {/* TOC / Quick Links (Optional, here just structured content) */}
                <div className="grid gap-12 lg:grid-cols-[1fr_300px] relative">

                    {/* Main Legal Text */}
                    <div className="space-y-16 text-lg leading-relaxed text-foreground/80">

                        {/* 1. Interpretation */}
                        <section id="interpretation" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">1. Interpretation and Definitions</h2>
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-foreground">Interpretation</h3>
                                <p>
                                    The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
                                </p>
                                <h3 className="text-xl font-semibold text-foreground mt-6">Definitions</h3>
                                <p>For the purposes of these Terms of Service:</p>
                                <ul className="list-disc pl-6 space-y-3 marker:text-muted-foreground">
                                    <li><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</li>
                                    <li><strong>Affiliate</strong> means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</li>
                                    <li><strong>Application</strong> means the software program provided by the Company downloaded by You on any electronic device, named <strong>BudGlio</strong>.</li>
                                    <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to BudGlio Inc., Bangalore, India.</li>
                                    <li><strong>Content</strong> refers to content such as text, images, or other information that can be posted, uploaded, linked to or otherwise made available by You, regardless of the form of that content.</li>
                                    <li><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</li>
                                    <li><strong>Service</strong> refers to the Application or the Website or both.</li>
                                    <li><strong>Terms and Conditions</strong> (also referred as "Terms") mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service.</li>
                                    <li><strong>Third-party Social Media Service</strong> means any services or content (including data, information, products or services) provided by a third-party that may be displayed, included or made available by the Service.</li>
                                    <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
                                </ul>
                            </div>
                        </section>

                        {/* 2. Acknowledgment */}
                        <section id="acknowledgment" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">2. Acknowledgment</h2>
                            <p>
                                These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
                            </p>
                            <p>
                                Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.
                            </p>
                            <p className="bg-muted/30 p-4 border-l-4 border-primary rounded-r-lg font-medium text-foreground">
                                By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.
                            </p>
                            <p>
                                You represent that you are over the age of 13. The Company does not permit those under 13 to use the Service.
                            </p>
                            <p>
                                Your access to and use of the Service is also conditioned on Your acceptance of and compliance with the Privacy Policy of the Company. Our Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your personal information when You use the Application or the Website and tells You about Your privacy rights and how the law protects You. Please read Our Privacy Policy carefully before using Our Service.
                            </p>
                        </section>

                        {/* 3. User Accounts */}
                        <section id="accounts" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">3. User Accounts</h2>
                            <p>
                                When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.
                            </p>
                            <p>
                                You are responsible for safeguarding the password that You use to access the Service and for any activities or actions under Your password, whether Your password is with Our Service or a Third-Party Social Media Service.
                            </p>
                            <p>
                                You agree not to disclose Your password to any third party. You must notify Us immediately upon becoming aware of any breach of security or unauthorized use of Your account.
                            </p>
                            <p>
                                You may not use as a username the name of another person or entity or that is not lawfully available for use, a name or trademark that is subject to any rights of another person or entity other than You without appropriate authorization, or a name that is otherwise offensive, vulgar or obscene.
                            </p>
                        </section>

                        {/* 4. Content */}
                        <section id="content" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">4. Content and Intellectual Property</h2>

                            <h3 className="text-xl font-semibold text-foreground">Your Right to Post Content</h3>
                            <p>
                                Our Service allows You to post Content. You are responsible for the Content that You post to the Service, including its legality, reliability, and appropriateness.
                            </p>
                            <p>
                                By posting Content to the Service, You grant Us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. You retain any and all of Your rights to any Content You submit, post or display on or through the Service and You are responsible for protecting those rights. You agree that this license includes the right for Us to make Your Content available to other users of the Service, who may also use Your Content subject to these Terms.
                            </p>

                            <h3 className="text-xl font-semibold text-foreground mt-6">Intellectual Property Rights</h3>
                            <p>
                                The Service and its original content (excluding Content provided by You or other users), features and functionality are and will remain the exclusive property of the Company and its licensors. The Service is protected by copyright, trademark, and other laws of both India and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of the Company.
                            </p>
                        </section>

                        {/* 5. Payments */}
                        <section id="payments" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">5. Payments and Subscriptions</h2>
                            <p>
                                Some parts of the Service are billed on a paid basis ("Plans"). You will be billed in advance on a recurring or one-time basis depending on the type of Plan you select.
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Fee Changes:</strong> The Company, in its sole discretion and at any time, may modify the fees. Any fee change will become effective at the end of the then-current Billing Cycle.</li>
                                <li><strong>Refunds:</strong> Except when required by law, paid fees are <strong>non-refundable</strong>. Certain refund requests for transactions may be considered by the Company on a case-by-case basis and granted at the sole discretion of the Company.</li>
                                <li><strong>Payment Information:</strong> You represent and warrant that: (i) You have the legal right to use any credit card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information You supply to us is true, correct and complete.</li>
                            </ul>
                        </section>


                        {/* 6. Prohibited Uses */}
                        <section id="prohibited" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">6. Prohibited Uses</h2>
                            <p>You may use the Service only for lawful purposes and in accordance with Terms. You agree not to use the Service:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>In any way that violates any applicable national or international law or regulation.</li>
                                <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
                                <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                                <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                                <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm the Company or users of the Service or expose them to liability.</li>
                            </ul>
                        </section>

                        {/* 7. Termination */}
                        <section id="termination" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">7. Termination</h2>
                            <p>
                                We may terminate or suspend Your Account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.
                            </p>
                            <p>
                                Upon termination, Your right to use the Service will cease immediately. If You wish to terminate Your Account, You may simply discontinue using the Service or delete it from the settings page.
                            </p>
                        </section>

                        {/* 8. Limitation of Liability */}
                        <section id="liability" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">8. Limitation of Liability</h2>
                            <div className="bg-muted/20 p-6 rounded-xl text-sm leading-relaxed border border-border/10">
                                <p className="uppercase font-bold mb-4">PLEASE READ CAREFULLY:</p>
                                <p>
                                    NOTWITHSTANDING ANY DAMAGES THAT YOU MIGHT INCUR, THE ENTIRE LIABILITY OF THE COMPANY AND ANY OF ITS SUPPLIERS UNDER ANY PROVISION OF THIS TERMS AND YOUR EXCLUSIVE REMEDY FOR ALL OF THE FOREGOING SHALL BE LIMITED TO THE AMOUNT ACTUALLY PAID BY YOU THROUGH THE SERVICE OR 100 USD IF YOU HAVEN'T PURCHASED ANYTHING THROUGH THE SERVICE.
                                </p>
                                <p className="mt-4">
                                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE COMPANY OR ITS SUPPLIERS BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER (INCLUDING, BUT NOT LIMITED TO, DAMAGES FOR LOSS OF PROFITS, LOSS OF DATA OR OTHER INFORMATION, FOR BUSINESS INTERRUPTION, FOR PERSONAL INJURY, LOSS OF PRIVACY ARISING OUT OF OR IN ANY WAY RELATED TO THE USE OF OR INABILITY TO USE THE SERVICE, THIRD-PARTY SOFTWARE AND/OR THIRD-PARTY HARDWARE USED WITH THE SERVICE, OR OTHERWISE IN CONNECTION WITH ANY PROVISION OF THIS TERMS), EVEN IF THE COMPANY OR ANY SUPPLIER HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES AND EVEN IF THE REMEDY FAILS OF ITS ESSENTIAL PURPOSE.
                                </p>
                            </div>
                        </section>

                        {/* 9. "AS IS" Disclaimer */}
                        <section id="disclaimer" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">9. "AS IS" and "AS AVAILABLE" Disclaimer</h2>
                            <p>
                                The Service is provided to You "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, the Company, on its own behalf and on behalf of its Affiliates and its and their respective licensors and service providers, expressly disclaims all warranties, whether express, implied, statutory or otherwise, with respect to the Service, including all implied warranties of merchantability, fitness for a particular purpose, title and non-infringement, and warranties that may arise out of course of dealing, course of performance, usage or trade practice.
                            </p>
                            <p>
                                Without limitation to the foregoing, the Company provides no warranty or undertaking, and makes no representation of any kind that the Service will meet Your requirements, achieve any intended results, be compatible or work with any other software, applications, systems or services, operate without interruption, meet any performance or reliability standards or be error free or that any errors or defects can or will be corrected.
                            </p>
                        </section>

                        {/* 10. Governing Law */}
                        <section id="governing" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">10. Governing Law</h2>
                            <p>
                                The laws of the Country, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service. Your use of the Application may also be subject to other local, state, national, or international laws. The "Country" refers to: <strong>India</strong>.
                            </p>
                        </section>

                        {/* 11. Disputes Resolution */}
                        <section id="disputes" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">11. Disputes Resolution</h2>
                            <p>
                                If You have any concern or dispute about the Service, You agree to first try to resolve the dispute informally by contacting the Company.
                            </p>
                            <h3 className="text-xl font-semibold text-foreground mt-4">For European Union (EU) Users</h3>
                            <p>
                                If You are a European Union consumer, you will benefit from any mandatory provisions of the law of the country in which you are resident in.
                            </p>
                        </section>

                        {/* 12. Severability and Waiver */}
                        <section id="severability" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">12. Severability and Waiver</h2>
                            <h3 className="text-xl font-semibold text-foreground">Severability</h3>
                            <p>
                                If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law and the remaining provisions will continue in full force and effect.
                            </p>
                            <h3 className="text-xl font-semibold text-foreground mt-4">Waiver</h3>
                            <p>
                                Except as provided herein, the failure to exercise a right or to require performance of an obligation under these Terms shall not effect a party's ability to exercise such right or require such performance at any time thereafter nor shall the waiver of a breach constitute a waiver of any subsequent breach.
                            </p>
                        </section>

                        {/* 13. Changes to Terms */}
                        <section id="changes" className="scroll-mt-24 space-y-4">
                            <h2 className="text-2xl font-bold text-foreground border-b border-border/10 pb-2 mb-6">13. Changes to These Terms and Conditions</h2>
                            <p>
                                We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.
                            </p>
                            <p>
                                By continuing to access or use Our Service after those revisions become effective, You agree to be bound by the revised terms. If You do not agree to the new terms, in whole or in part, please stop using the website and the Service.
                            </p>
                        </section>



                    </div>

                    {/* Sidebar / Floater (Desktop) */}
                    <div className="hidden lg:block relative">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                                <h3 className="font-bold text-lg mb-4">Quick Navigation</h3>
                                <nav className="flex flex-col space-y-2 text-sm text-muted-foreground">
                                    <a href="#interpretation" className="hover:text-primary transition-colors">1. Interpretation</a>
                                    <a href="#acknowledgment" className="hover:text-primary transition-colors">2. Acknowledgment</a>
                                    <a href="#accounts" className="hover:text-primary transition-colors">3. User Accounts</a>
                                    <a href="#content" className="hover:text-primary transition-colors">4. Content & IP</a>
                                    <a href="#payments" className="hover:text-primary transition-colors">5. Payments</a>
                                    <a href="#prohibited" className="hover:text-primary transition-colors">6. Prohibited Uses</a>
                                    <a href="#termination" className="hover:text-primary transition-colors">7. Termination</a>
                                    <a href="#liability" className="hover:text-primary transition-colors">8. Limitation of Liability</a>
                                    <a href="#disclaimer" className="hover:text-primary transition-colors">9. Disclaimer</a>
                                    <a href="#governing" className="hover:text-primary transition-colors">10. Governing Law</a>

                                </nav>
                            </div>
                            <Button className="w-full rounded-full" onClick={() => window.close()}>
                                I Accept
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Bar */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur border-t border-border/10">
                    <Button className="w-full rounded-full shadow-lg" size="lg" onClick={() => window.close()}>
                        I Accept & Close
                    </Button>
                </div>

            </main>
        </div>
    );
};

export default TermsOfService;
