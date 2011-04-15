set :application, "multi_radiant"
set :scm, :git
set :repository, "git@github.com:spanner/radiant_multisite_template.git"
set :git_enable_submodules, 1
set :ssh_options, { :forward_agent => true }

set :user, 'spanner'
set :group, 'spanner'
set :branch, 'master'

role :web, "moriarty.spanner.org"
role :app, "moriarty.spanner.org"
# role :db,  "data.spanner.org", :primary => true

set :deploy_to, "/var/www/#{application}"
set :deploy_via, :remote_cache
default_run_options[:pty] = true

after "deploy:setup" do
  sudo "mkdir -p #{deploy_to}/logs" 
  sudo "mkdir -p #{shared_path}/assets/assets" 
  sudo "mkdir -p #{shared_path}/config" 
  sudo "touch #{shared_path}/config/nginx.conf"
  sudo "ln -s #{shared_path}/config/nginx.conf /etc/nginx/sites-available/#{application}"
  sudo "chown -R #{user}:#{group} #{shared_path}"
  sudo "chown #{user}:#{group} /var/www/#{application}/releases"
end

after "deploy:update" do
  run "ln -s #{shared_path}/config/database.yml #{current_release}/config/database.yml" 
  run "ln -s #{shared_path}/assets/assets #{current_release}/public/assets" 
  run "ln -s #{shared_path}/public/favicon.ico #{current_release}/public/favicon.ico"
  run "ln -s #{shared_path}/public/robots.txt #{current_release}/public/robots.txt"
  run "ln -s #{shared_path}/public/images/local #{current_release}/public/images/local"
  run "ln -s #{shared_path}/public/fonts #{current_release}/public/fonts"
  run "ln -s /var/www/radiant_beta #{current_release}/vendor/radiant"
end

namespace :deploy do
  task :start, :roles => :app do
    run "touch #{current_release}/tmp/restart.txt"
  end
  task :stop, :roles => :app do
    # There is no stop.
  end
  task :restart, :roles => :app do
    run "touch #{current_release}/tmp/restart.txt"
  end
  task :clear_cached_copy do
    run "rm -rf #{shared_path}/cached-copy"
  end
end
