import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
} from '@backstage/core-components';

export const SecurityGuidelines = () => (
  <Page themeId="documentation">
    <Header title="Security Guidelines" subtitle="Best practices and security standards" />
    <Content>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <InfoCard title="Security Guidelines Overview">
            <Typography variant="body1">
              🚧 Coming Soon ! 🚧
            </Typography>
          </InfoCard>
        </Grid>
      </Grid>
    </Content>
  </Page>
);
