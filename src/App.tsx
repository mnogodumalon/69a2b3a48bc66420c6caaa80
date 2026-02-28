import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import KlientenstammdatenPage from '@/pages/KlientenstammdatenPage';
import PflegefachkraeftePage from '@/pages/PflegefachkraeftePage';
import MedikamentenplanPage from '@/pages/MedikamentenplanPage';
import PflegeplanungPage from '@/pages/PflegeplanungPage';
import TourenplanungPage from '@/pages/TourenplanungPage';
import VitalwerteErfassungPage from '@/pages/VitalwerteErfassungPage';
import WunddokumentationPage from '@/pages/WunddokumentationPage';
import PflegedurchfuehrungPage from '@/pages/PflegedurchfuehrungPage';
import LeistungsnachweisPage from '@/pages/LeistungsnachweisPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="klientenstammdaten" element={<KlientenstammdatenPage />} />
          <Route path="pflegefachkraefte" element={<PflegefachkraeftePage />} />
          <Route path="medikamentenplan" element={<MedikamentenplanPage />} />
          <Route path="pflegeplanung" element={<PflegeplanungPage />} />
          <Route path="tourenplanung" element={<TourenplanungPage />} />
          <Route path="vitalwerte-erfassung" element={<VitalwerteErfassungPage />} />
          <Route path="wunddokumentation" element={<WunddokumentationPage />} />
          <Route path="pflegedurchfuehrung" element={<PflegedurchfuehrungPage />} />
          <Route path="leistungsnachweis" element={<LeistungsnachweisPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}